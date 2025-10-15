const rateLimit = require('express-rate-limit');

// Simple memory-based rate limiting (no external stores)
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false
  });
};

// General API rate limiting
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this IP, please try again later.'
);

// Authentication rate limiting (stricter)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 auth attempts per window
  'Too many authentication attempts, please try again later.'
);

// Assessment submission rate limiting
const assessmentLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 assessment submissions per hour
  'Assessment submission limit reached. Please wait before submitting another assessment.'
);

// AI service rate limiting
const aiLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 AI requests per hour
  'AI service limit reached. Please try again later.'
);

module.exports = {
  apiLimiter,
  authLimiter,
  assessmentLimiter,
  aiLimiter
};
