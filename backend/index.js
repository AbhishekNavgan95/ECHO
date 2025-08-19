import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/community/vectorstores/pinecone';

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

const app = express();
app.set('trust proxy', 1); // for accurate IPs behind proxy

app.use(cors());
app.use(express.json({ limit: '16mb' }));

// -------------------- RATE LIMITERS --------------------

// General limiter: 20 requests / 24 hours per IP for chat
const generalRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip general rate limiting for chat-specific endpoints and health
    return req.path === '/health' || req.path === '/chat-limit';
  },
  handler: (req, res) => {
    return res.status(429).json({
      ok: false,
      error: 'Too many requests from this IP. Please try again later.',
    });
  },
});

// Dedicated chat limiter: 20 chat requests / 24 hours per IP
const chatRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // 20 chat requests per 24 hours
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a different key prefix for chat limits to separate from general limits
    const ip = req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      'unknown';
    return `chat:${ip}`; // Prefix with 'chat:' to separate from general rate limits
  },
  skip: (req) => req.path === '/health' || req.ip === '::ffff:127.0.0.1',
  handler: (req, res) => {
    console.log(`Chat rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      ok: false,
      error: 'Daily chat limit exceeded (20 chats per 24 hours). Please try again tomorrow.',
      rateLimitExceeded: true,
    });
  },
});

// Apply general limiter to all routes
app.use(generalRateLimit);

// -------------------- FILE UPLOAD --------------------
const upload = multer({ dest: 'uploads/' });

// -------------------- ENV --------------------
const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'quickstart';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

const EMBEDDING_DIMS = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
};

if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is required');

// -------------------- OPENAI --------------------
const embeddings = new OpenAIEmbeddings({
  apiKey: OPENAI_API_KEY,
  model: EMBEDDING_MODEL,
});

const chat = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  temperature: 0.2,
});

// -------------------- PINECONE --------------------
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

async function ensurePineconeIndex(name, dimension) {
  const indexes = await pc.listIndexes();
  const exists = indexes.indexes?.some((i) => i.name === name);
  if (!exists) {
    console.log(`[pinecone] creating index ${name} (dim ${dimension})...`);
    await pc.createIndex({
      name,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: process.env.PINECONE_CLOUD || 'aws',
          region: process.env.PINECONE_REGION || 'us-east-1',
        },
      },
    });
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const d = await pc.describeIndex(name);
      if (d.status?.ready) { ready = true; break; }
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!ready) throw new Error('Pinecone index not ready yet. Try again later.');
    console.log('[pinecone] index ready.');
  } else {
    const d = await pc.describeIndex(name);
    const existingDim = d.dimension || d.spec?.serverless?.dimension;
    if (existingDim && existingDim !== dimension) {
      throw new Error(`Pinecone index "${name}" has dimension ${existingDim}, but required ${dimension}.`);
    }
  }
}

async function getVectorStore(namespace) {
  await ensurePineconeIndex(PINECONE_INDEX, EMBEDDING_DIMS[EMBEDDING_MODEL]);
  const pineconeIndex = pc.index(PINECONE_INDEX);
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace,
  });
}

// -------------------- UTILITIES --------------------
async function chunkDocuments(documents, chunkSize = 1000, overlap = 150) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap: overlap });
  return splitter.splitDocuments(documents);
}

async function loadFile(filepath, originalname, mimetype) {
  try {
    await fs.promises.access(filepath, fs.constants.R_OK);

    let loader;
    if ((mimetype && mimetype.includes('pdf')) || filepath.endsWith('.pdf')) {
      loader = new PDFLoader(filepath, { parsedItemSeparator: '\n' });
    } else if ((mimetype && mimetype.includes('word')) || filepath.endsWith('.docx')) {
      loader = new DocxLoader(filepath);
    } else if (filepath.endsWith('.csv')) {
      loader = new CSVLoader(filepath);
    } else {
      loader = new TextLoader(filepath);
    }
    const docs = await loader.load();
    docs.forEach(doc => {
      doc.metadata = {
        ...(doc.metadata || {}),
        source: originalname,
        fileType: mimetype || path.extname(originalname).slice(1) || 'unknown'
      };
    });
    return docs;
  } finally {
    fs.promises.unlink(filepath).catch(() => { });
  }
}

async function loadUrl(url) {
  const loader = new CheerioWebBaseLoader(url, {
    launchOptions: { headless: true },
    gotoOptions: { waitUntil: "domcontentloaded" }
  });
  const docs = await loader.load();
  docs.forEach(d => d.metadata = { ...(d.metadata || {}), url });
  return docs;
}

// -------------------- ROUTES --------------------

// Ingest
app.post('/ingest', upload.single('file'), async (req, res) => {
  try {
    const datasetId = String(req.query.datasetId || 'default');
    const namespace = datasetId;

    const text = req.body?.text?.trim() || '';
    const url = req.body?.url?.trim() || '';
    const file = req.file;

    if (!text && !url && !file) {
      return res.status(400).json({ ok: false, error: 'Provide at least one of: text, url, file' });
    }

    const store = await getVectorStore(namespace);
    let totalChunks = 0;

    if (text) {
      const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 150 });
      const textChunks = await splitter.createDocuments([text], [{}]);
      await store.addDocuments(textChunks.map(c => ({
        pageContent: c.pageContent,
        metadata: c.metadata || {},
        id: uuid(),
      })));
      totalChunks += textChunks.length;
    }

    if (url) {
      const urlDocs = await loadUrl(url);
      const urlChunks = await chunkDocuments(urlDocs, 1200, 200);
      await store.addDocuments(urlChunks.map(c => ({
        pageContent: c.pageContent,
        metadata: c.metadata || {},
        id: uuid(),
      })));
      totalChunks += urlChunks.length;
    }

    if (file) {
      const fileDocs = await loadFile(file.path, file.originalname, file.mimetype);
      const fileChunks = await chunkDocuments(fileDocs, 1000, 150);
      await store.addDocuments(fileChunks.map(c => ({
        pageContent: c.pageContent,
        metadata: c.metadata || {},
        id: uuid(),
      })));
      totalChunks += fileChunks.length;
    }

    res.json({ ok: true, datasetId, chunks: totalChunks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Chat limit status - apply chat rate limiter to get accurate info
app.get('/chat-limit', chatRateLimit, (req, res) => {
  const info = req.rateLimit || {};
  res.json({
    ok: true,
    used: info.limit ? info.limit - info.remaining : 0,
    remaining: info.remaining ?? 20,
    total: info.limit ?? 20,
    resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
    resetTimestamp: info.resetTime ?? null,
  });
});

// Chat endpoint with dedicated rate limiting
app.post('/chat', chatRateLimit, async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ ok: false, error: 'question (string) is required' });
    }

    const datasetId = String(req.query.datasetId || 'default');
    const namespace = datasetId;
    const store = await getVectorStore(namespace);

    const topK = Number(req.query.k || 6);
    const docs = await store.similaritySearch(question, topK);

    if (!docs || docs.length === 0) {
      const info = req.rateLimit || {};
      return res.json({
        ok: true,
        answer: "I couldn’t find anything in your data to answer that.",
        chatLimit: {
          used: info.limit ? info.limit - info.remaining : 0,
          remaining: info.remaining ?? 20,
          total: info.limit ?? 20,
          resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
        }
      });
    }

    const context = docs.map((d, i) => {
      const meta = d.metadata ? JSON.stringify(d.metadata) : '{}';
      return `#${i + 1}\n${d.pageContent}\nMETA:${meta}`;
    }).join('\n\n');

    console.log("context : ", context);

    const SYSTEM = `
      You are a concise RAG assistant. 
      Use only the provided context snippets to answer. If the answer is not in the context, say you don't know.
      
      Rule: 
      - Answer in Hindi (chill + respectful vibe) only if the user question is in Hindi. Otherwise answer in English.
      - Always return the context where you got the answer from. 

      Context:
      - ${context}
    `;

    const response = await chat.invoke([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: question },
    ]);

    // Get chat-specific rate limit info
    const info = req.rateLimit || {};

    res.json({
      ok: true,
      answer: response.content,
      chatLimit: {
        used: info.limit ? info.limit - info.remaining : 0,
        remaining: info.remaining ?? 20,
        total: info.limit ?? 20,
        resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// -------------------- START --------------------
app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
});
