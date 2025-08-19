import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generalRateLimit } from './middleware/rateLimiter.js';
import ingestRoutes from './routes/ingest.js';
import chatRoutes from './routes/chat.js';
import chatLimitRoutes from './routes/chatLimit.js';
import healthRoutes from './routes/health.js';

const app = express();
app.set('trust proxy', 1); // for accurate IPs behind proxy

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '16mb' }));

// Apply general limiter to all routes
app.use(generalRateLimit);

// -------------------- ROUTES --------------------
app.use('/ingest', ingestRoutes);
app.use('/chat', chatRoutes);
app.use('/chat-limit', chatLimitRoutes);
app.use('/health', healthRoutes);

// -------------------- START --------------------
app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
});
