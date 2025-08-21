import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/auth.js';
import { Session } from '../models/Session.js';
import { getVectorStore } from '../config/database.js';
import { chat } from '../config/openai.js';
import { chatRateLimit, getChatLimitSnapshot } from '../middleware/rateLimiter.js';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from 'langchain/document_loaders/fs/text';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', req.user.id.toString());
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, TXT, and MD files are allowed'));
    }
  }
});

// Query enhancement function using smaller GPT model
async function enhanceQuery(query) {
  try {
    const enhancementPrompt = `
Enhance the following user query to make it more detailed and context-rich for better semantic search results. 
Keep the core intent but expand with relevant keywords and concepts.

Original query: "${query}"

Enhanced query:`;

    const response = await chat.invoke([
      { role: 'system', content: 'You are a query enhancement assistant. Expand user queries to be more detailed and searchable while preserving the original intent.' },
      { role: 'user', content: enhancementPrompt }
    ]);

    return response.content.trim();
  } catch (error) {
    console.error('Query enhancement failed:', error);
    return query; // Fallback to original query
  }
}

// Create a new session
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, initialContent } = req.body;
    
    const sessionId = Session.generateSessionId();
    const sessionName = name || Session.generateSessionName(initialContent);
    
    const session = new Session({
      sessionId,
      userId: req.user.id,
      name: sessionName,
      inputs: {
        textSnippets: [],
        uploadedUrls: [],
        uploadedFiles: []
      }
    });

    // Add initial content if provided
    if (initialContent) {
      await session.addTextSnippet(initialContent);
    }

    await session.save();
    res.json({ ok: true, session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get all sessions for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ userId: req.user.id, isActive: true })
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('sessionId name createdAt lastActivityAt inputs messages');

    const total = await Session.countDocuments({ userId: req.user.id, isActive: true });

    res.json({ 
      ok: true, 
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get specific session
router.get('/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOne({ 
      sessionId: req.params.sessionId, 
      userId: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    res.json({ ok: true, session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Update session name
router.patch('/:sessionId', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const session = await Session.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user.id },
      { name, lastActivityAt: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    res.json({ ok: true, session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Delete session (soft delete)
router.delete('/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    res.json({ ok: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Add text snippet to session
router.post('/:sessionId/text', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ ok: false, error: 'Content is required' });
    }

    const session = await Session.findOne({ 
      sessionId: req.params.sessionId, 
      userId: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    await session.addTextSnippet(content);

    // Add to vector store
    const userNamespace = `u_${req.user.id}_${req.params.sessionId}`;
    const store = await getVectorStore(userNamespace);
    
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const docs = await textSplitter.createDocuments([content], [{
      type: 'text',
      sessionId: req.params.sessionId,
      addedAt: new Date().toISOString()
    }]);
    
    await store.addDocuments(docs);

    res.json({ ok: true, session });
  } catch (error) {
    console.error('Error adding text snippet:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Add URL to session
router.post('/:sessionId/url', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'URL is required' });
    }

    const session = await Session.findOne({ 
      sessionId: req.params.sessionId, 
      userId: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    // Scrape webpage content
    let title = '';
    let content = '';
    
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      title = document.querySelector('title')?.textContent?.trim() || url;
      
      // Extract main content (remove scripts, styles, etc.)
      const scripts = document.querySelectorAll('script, style, nav, footer, header');
      scripts.forEach(el => el.remove());
      
      content = document.body?.textContent?.trim() || '';
    } catch (scrapeError) {
      console.error('Error scraping URL:', scrapeError);
      title = url;
      content = `Failed to scrape content from ${url}`;
    }

    await session.addUrl(url, title);

    // Add content to vector store (but not URL itself to session history)
    if (content) {
      const userNamespace = `u_${req.user.id}_${req.params.sessionId}`;
      const store = await getVectorStore(userNamespace);
      
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      const docs = await textSplitter.createDocuments([content], [{
        type: 'url',
        url,
        title,
        sessionId: req.params.sessionId,
        addedAt: new Date().toISOString()
      }]);
      
      await store.addDocuments(docs);
    }

    res.json({ ok: true, session });
  } catch (error) {
    console.error('Error adding URL:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Remove file from session and vector store
router.delete('/:sessionId/file/:filename', requireAuth, async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const session = await Session.findOne({ sessionId, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    // Remove file from session document
    await session.removeFile(filename);

    // Remove vectors from Pinecone (vector store)
    const userNamespace = `u_${req.user.id}_${sessionId}`;
    const store = await getVectorStore(userNamespace);
    // PineconeStore exposes a .delete method (see langchain docs)
    // We'll use a filter on metadata.filename or metadata.originalName
    await store.delete({
      filter: {
        $or: [
          { filename: filename },
          { originalName: filename }
        ]
      }
    });

    // Attempt to delete the file from disk (optional, best effort)
    try {
      const userUploadDir = path.join(process.cwd(), 'uploads', req.user.id.toString());
      const filePath = path.join(userUploadDir, filename);
      await fs.unlink(filePath);
    } catch (err) {
      // File may not exist, ignore
    }

    res.json({ ok: true, message: 'File removed from session and memory.' });
  } catch (error) {
    console.error('Error removing file from session:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Upload file to session
router.post('/:sessionId/file', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'File is required' });
    }

    const session = await Session.findOne({ 
      sessionId: req.params.sessionId, 
      userId: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    await session.addFile(
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    // Process file and add to vector store
    const filePath = req.file.path;
    let loader;
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    switch (ext) {
      case '.pdf':
        loader = new PDFLoader(filePath);
        break;
      case '.docx':
        loader = new DocxLoader(filePath);
        break;
      case '.txt':
      case '.md':
        loader = new TextLoader(filePath);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    const docs = await loader.load();
    
    // Add metadata to documents
    const docsWithMetadata = docs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        type: 'file',
        filename: req.file.originalname,
        sessionId: req.params.sessionId,
        addedAt: new Date().toISOString()
      }
    }));

    const userNamespace = `u_${req.user.id}_${req.params.sessionId}`;
    const store = await getVectorStore(userNamespace);
    
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const splitDocs = await textSplitter.splitDocuments(docsWithMetadata);
    await store.addDocuments(splitDocs);

    // Clean up temporary file after processing
    try {
      await fs.unlink(filePath);
      
      // Try to remove the user's upload directory if it's empty
      const uploadDir = path.join(process.cwd(), 'uploads', req.user.id.toString());
      try {
        await fs.rmdir(uploadDir);
      } catch (rmdirError) {
        // Directory not empty or doesn't exist, ignore
      }
    } catch (unlinkError) {
      console.warn('Failed to delete temporary file:', unlinkError.message);
    }

    res.json({ ok: true, session });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up temporary file on error as well
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
        
        // Try to remove the user's upload directory if it's empty
        const uploadDir = path.join(process.cwd(), 'uploads', req.user.id.toString());
        try {
          await fs.rmdir(uploadDir);
        } catch (rmdirError) {
          // Directory not empty or doesn't exist, ignore
        }
      } catch (unlinkError) {
        console.warn('Failed to delete temporary file after error:', unlinkError.message);
      }
    }
    
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Chat with session context
router.post('/:sessionId/chat', requireAuth, chatRateLimit, async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ ok: false, error: 'Question is required' });
    }

    const session = await Session.findOne({ 
      sessionId: req.params.sessionId, 
      userId: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }

    // Enhance query
    const enhancedQuery = await enhanceQuery(question);
    
    // Get context from vector store using enhanced query
    const userNamespace = `u_${req.user.id}_${req.params.sessionId}`;
    const store = await getVectorStore(userNamespace);
    const topK = Number(req.query.k || 6);
    const docs = await store.similaritySearch(enhancedQuery, topK);

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const limitSnapshot = getChatLimitSnapshot(req.user?.id);
    res.write(`data: ${JSON.stringify({
      type: 'start',
      chatLimit: limitSnapshot,
    })}\n\n`);

    if (!docs || docs.length === 0) {
      res.write(`data: ${JSON.stringify({
        type: 'end',
        fullContent: "I couldn't find anything in this session's context to answer that.",
        chatLimit: limitSnapshot,
      })}\n\n`);
      res.end();
      return;
    }

    const context = docs
      .map((d, i) => {
        const meta = d.metadata ? JSON.stringify(d.metadata) : '{}';
        return `#${i + 1}\n${d.pageContent}\nMETA:${meta}`;
      })
      .join('\n\n');

    const SYSTEM = `
You are a concise RAG assistant for a session-based chat system.

Rules:
- Use BOTH the provided context snippets (from this session's knowledge base) AND the prior conversation history to answer the user.
- If the answer is not present in either the context snippets or history, say:
  "I do not have any information about that topic in this session's context. You can add more data through text snippets, URLs, or file uploads."
- If the question is in Hindi, answer in Hindi (respectful + chill vibe). Otherwise answer in English.
- Always return the reference of data where you got the answer from if it comes from context. If the answer comes from chat history, mention it's from the prior conversation.

Context snippets from this session:
${context}`;

    // Get prior messages from session
    const priorMessages = (session.messages || []).slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      const stream = await chat.stream([
        { role: 'system', content: SYSTEM },
        ...priorMessages,
        { role: 'user', content: question },
      ]);

      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
          res.write(`data: ${JSON.stringify({
            type: 'chunk',
            content: chunk.content,
          })}\n\n`);
        }
      }

      const endSnapshot = getChatLimitSnapshot(req.user?.id);
      res.write(`data: ${JSON.stringify({
        type: 'end',
        fullContent: fullContent,
        chatLimit: endSnapshot,
      })}\n\n`);

      // Save messages to session
      await session.addMessage('user', question, question, enhancedQuery);
      await session.addMessage('assistant', fullContent);

    } catch (streamError) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: streamError.message,
      })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Error in session chat:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
