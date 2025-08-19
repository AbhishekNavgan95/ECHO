import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// General limiter: 20 requests / 24 hours per IP
const generalRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/chat-limit',
  handler: (req, res) => {
    return res.status(429).json({
      ok: false,
      error: 'Too many requests from this IP. Please try again later.',
    });
  },
});

// Dedicated chat limiter: 20 chat requests / 24 hours per IP
const chatRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `chat:${ipKeyGenerator(req)}`, // ✅ safe for IPv6
  skip: (req) => req.path === '/health' || req.ip === '::ffff:127.0.0.1',
  handler: (req, res) => {
    console.log(`Chat rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      ok: false,
      error: 'Daily chat limit exceeded (20 chats per 24 hours). Please try again tomorrow.',
      rateLimitExceeded: true,
    });
  },
});

export { generalRateLimit, chatRateLimit };
