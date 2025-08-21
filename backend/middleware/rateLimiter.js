import { User } from '../models/User.js';

const CHAT_LIMIT = 30;

// Database-based chat limit middleware - permanent 30 chat limit per user
const chatRateLimit = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'User not found',
      });
    }

    // Check if user has exceeded permanent chat limit
    if (user.chatCount >= CHAT_LIMIT) {
      return res.status(429).json({
        ok: false,
        error: `Chat limit exceeded. You have used all ${CHAT_LIMIT} chats available for your account.`,
        rateLimitExceeded: true,
        chatLimit: {
          used: user.chatCount,
          remaining: 0,
          total: CHAT_LIMIT,
          resetTime: null,
          resetTimestamp: null,
        },
      });
    }

    // Increment chat count
    await User.findByIdAndUpdate(user._id, {
      $inc: { chatCount: 1 }
    });

    // Add rate limit info to request for use in response
    req.rateLimit = {
      used: user.chatCount + 1,
      remaining: CHAT_LIMIT - (user.chatCount + 1),
      total: CHAT_LIMIT,
      resetTime: null,
      resetTimestamp: null,
    };

    next();
  } catch (error) {
    console.error('Chat rate limit error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
    });
  }
};

// Get current chat limit status for a user
async function getChatLimitSnapshot(userId) {
  try {
    if (!userId) {
      return {
        used: 0,
        remaining: CHAT_LIMIT,
        total: CHAT_LIMIT,
        resetTime: null,
        resetTimestamp: null,
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        used: 0,
        remaining: CHAT_LIMIT,
        total: CHAT_LIMIT,
        resetTime: null,
        resetTimestamp: null,
      };
    }

    return {
      used: user.chatCount,
      remaining: Math.max(0, CHAT_LIMIT - user.chatCount),
      total: CHAT_LIMIT,
      resetTime: null,
      resetTimestamp: null,
    };
  } catch (error) {
    console.error('Get chat limit snapshot error:', error);
    return {
      used: 0,
      remaining: CHAT_LIMIT,
      total: CHAT_LIMIT,
      resetTime: null,
      resetTimestamp: null,
    };
  }
}

// No-op general rate limit for backward compatibility
const generalRateLimit = (_req, _res, next) => next();

export { generalRateLimit, chatRateLimit, getChatLimitSnapshot };
