import express from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getVectorStore } from '../config/database.js';
import { chunkDocuments, loadFile, loadUrl } from '../utils/documentLoaders.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Ingest endpoint (auth required)
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const datasetId = String(req.query.datasetId || 'default');
    const userNamespace = `u_${req.user.id}_${datasetId}`;

    const text = req.body?.text?.trim() || '';
    const url = req.body?.url?.trim() || '';
    const file = req.file;

    if (!text && !url && !file) {
      return res.status(400).json({ ok: false, error: 'Provide at least one of: text, url, file' });
    }

    const store = await getVectorStore(userNamespace);
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

export default router;
