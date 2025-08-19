import rateLimit from 'express-rate-limit';

// General limiter: 20 requests / 24 hours per IP for chat
const generalRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip general rate limiting for chat-specific endpoints and health
    return req.path === '/health' || req.path === '/chat-limit';
  },
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
  max: 20, // 20 chat requests per 24 hours
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a different key prefix for chat limits to separate from general limits
    const ip = req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      'unknown';
    return `chat:${ip}`; // Prefix with 'chat:' to separate from general rate limits
  },
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
