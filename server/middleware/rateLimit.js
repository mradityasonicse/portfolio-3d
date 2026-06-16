const { RateLimiterMemory } = require('rate-limiter-flexible');

// General API rate limiter
const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Auth rate limiter (stricter)
const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
  blockDuration: 300,
});

function rateLimitMiddleware(limiter = apiLimiter) {
  return async (req, res, next) => {
    const key = req.ip || 'unknown';
    try {
      await limiter.consume(key);
      next();
    } catch (e) {
      res.status(429).json({ status: 'error', message: 'Too many requests. Please try again later.' });
    }
  };
}

module.exports = { rateLimitMiddleware, apiLimiter, authLimiter };
