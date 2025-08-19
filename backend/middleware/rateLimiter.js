import rateLimit from 'express-rate-limit';

// In-memory per-user store that exposes a getter without consuming requests
class InMemoryUserStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.records = new Map();
  }

  init(options = {}) {
    if (options.windowMs) this.windowMs = options.windowMs;
  }

  _ensureRecord(key) {
    const now = Date.now();
    let rec = this.records.get(key);
    if (!rec || rec.resetTimeMs <= now) {
      rec = { totalHits: 0, resetTimeMs: now + this.windowMs };
      this.records.set(key, rec);
    }
    return rec;
  }

  increment(key) {
    const rec = this._ensureRecord(key);
    rec.totalHits += 1;
    return { totalHits: rec.totalHits, resetTime: new Date(rec.resetTimeMs) };
  }

  decrement(key) {
    const rec = this._ensureRecord(key);
    rec.totalHits = Math.max(0, rec.totalHits - 1);
  }

  resetKey(key) {
    this.records.delete(key);
  }

  get(key) {
    const rec = this._ensureRecord(key);
    return { totalHits: rec.totalHits, resetTime: new Date(rec.resetTimeMs) };
  }
}

// Global limiter removed (policy: only per-user chat limit). Keep a no-op to avoid breaking imports if any remain.
const generalRateLimit = (_req, _res, next) => next();

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const chatStore = new InMemoryUserStore(WINDOW_MS);

// Dedicated chat limiter: 20 chat requests / 24 hours per user (applied on /chat only)
const chatRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return `chat:user:${userId || 'anonymous'}`;
  },
  store: chatStore,
  handler: (req, res) => {
    return res.status(429).json({
      ok: false,
      error: 'Daily chat limit exceeded (20 chats per 24 hours). Please try again tomorrow.',
      rateLimitExceeded: true,
    });
  },
});

function getChatLimitSnapshot(userId) {
  const key = `chat:user:${userId || 'anonymous'}`;
  const info = chatStore.get(key);
  const limit = 20;
  const used = Math.min(info.totalHits, limit);
  const remaining = Math.max(0, limit - used);
  return {
    used,
    remaining,
    total: limit,
    resetTime: info.resetTime ? info.resetTime.toISOString() : null,
    resetTimestamp: info.resetTime ? info.resetTime.getTime() : null,
  };
}

export { generalRateLimit, chatRateLimit, getChatLimitSnapshot };
