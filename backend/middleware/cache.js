const { getRedisClient } = require('../utils/redisClient');

const cache = (ttlSeconds) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const client = getRedisClient();
    // Cache key incorporates user ID if authenticated, to prevent data leaks between users
    const userId = req.user ? req.user.id : 'public';
    const key = `cache:${userId}:${req.originalUrl}`;

    try {
      const cachedData = await client.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Hijack res.json to store in Redis before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Store in Redis
        client.setex(key, ttlSeconds, JSON.stringify(body)).catch(err => {
          console.error('Redis cache error:', err);
        });
        // Send original response
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Redis cache middleware error:', error);
      next(); // Proceed without cache if Redis fails
    }
  };
};

const invalidateCache = async (userId, pathPrefix = '') => {
  try {
    const client = getRedisClient();
    const pattern = `cache:${userId}:${pathPrefix}*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};

module.exports = { cache, invalidateCache };
