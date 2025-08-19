import express from 'express';
import { chatRateLimit, getChatLimitSnapshot } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Chat limit status - apply chat rate limiter to get accurate info (auth required)
router.get('/', requireAuth, (req, res) => {
  const snapshot = getChatLimitSnapshot(req.user?.id)
  res.json({ ok: true, ...snapshot })
});

export default router;
