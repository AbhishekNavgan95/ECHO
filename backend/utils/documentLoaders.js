import fs from 'fs';
import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";

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
    fs.unlinkSync(filepath).catch(() => { });
  }
}

async function loadUrl(url) {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: { headless: true }, // full browser
    gotoOptions: { waitUntil: "networkidle0" }, // waits for all requests
    evaluate: async (page, browser) => {
      const content = await page.content();
      return content;
    },
  });
  
  const docs = await loader.load();
  docs.forEach(d => d.metadata = { ...(d.metadata || {}), url });
  return docs;
}

export { chunkDocuments, loadFile, loadUrl };
