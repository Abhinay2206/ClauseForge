const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient } = require('../utils/redisClient');

// We need a helper to ensure we connect to Redis before creating the store, or use ioredis
const client = getRedisClient();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for testing (previously 100)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (...args) => client.call(...args),
  }),
  message: {
    message: 'Too many requests created from this IP, please try again after 15 minutes'
  }
});

module.exports = {
  apiLimiter
};
