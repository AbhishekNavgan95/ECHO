import express from 'express';
import { chatRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// Chat limit status - apply chat rate limiter to get accurate info
router.get('/', chatRateLimit, (req, res) => {
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

export default router;
