import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.json({ ok: true, user: req.user ? { id: req.user.id, email: req.user.email, name: req.user.name } : null });
});

export default router;
