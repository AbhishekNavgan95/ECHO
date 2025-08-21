import express from 'express';
import { getChatLimitSnapshot } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const snapshot = await getChatLimitSnapshot(req.user?.id);
  res.json({ ok: true, ...snapshot });
});

export default router;
