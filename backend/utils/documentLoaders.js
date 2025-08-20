import fs from 'fs';
import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { chromium } from 'playwright'; // ✅ switched to playwright

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
    try {
      await fs.promises.unlink(filepath);
    } catch (e) { /* ignore */ }
  }
}

async function loadUrl(url) {
  try {
    // First try Cheerio (fast, no browser)
    const cheerioLoader = new CheerioWebBaseLoader(url);
    const cheerioDocs = await cheerioLoader.load();
    if (cheerioDocs?.length) {
      cheerioDocs.forEach(d => d.metadata = { ...(d.metadata || {}), url });
      return cheerioDocs;
    }
  } catch (err) {
    console.warn(`Cheerio failed for ${url}, falling back to Playwright...`, err.message);
  }

  // Fallback to Playwright (handles JS-heavy sites)
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const content = await page.content();
  await browser.close();

  return [{ pageContent: content, metadata: { url } }];
}

export { chunkDocuments, loadFile, loadUrl };
