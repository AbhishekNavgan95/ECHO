import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { generalRateLimit } from './middleware/rateLimiter.js';
import ingestRoutes from './routes/ingest.js';
import chatRoutes from './routes/chat.js';
import chatLimitRoutes from './routes/chatLimit.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import { connectMongo } from './config/mongo.js';
import { attachUserIfPresent } from './middleware/auth.js';

const app = express();
app.set('trust proxy', 1); // for accurate IPs behind proxy

const PORT = process.env.PORT || 5000;

// CORS (allow frontend and credentials)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '16mb' }));
app.use(cookieParser());

// Connect to Mongo
await connectMongo();

// Apply general limiter to all routes
app.use(attachUserIfPresent, generalRateLimit);

// -------------------- ROUTES --------------------
app.use('/auth', authRoutes);
app.use('/ingest', ingestRoutes);
app.use('/chat', chatRoutes);
app.use('/chat-limit', chatLimitRoutes);
app.use('/health', healthRoutes);

// -------------------- START --------------------
app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
});
