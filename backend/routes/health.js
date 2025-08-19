import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.json({ ok: true });
});

export default router;
