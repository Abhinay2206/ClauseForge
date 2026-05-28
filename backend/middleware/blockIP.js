const { getRedisClient } = require('../utils/redisClient');

const BLOCKED_IPS_KEY = 'cf:blocked_ips';

/**
 * blockIP middleware
 * Checks the Redis-backed blocked IPs set before processing requests.
 * Blocked IPs are stored as a Redis Hash: cf:blocked_ips -> { [ip]: reason }
 */
const blockIP = async (req, res, next) => {
  try {
    const client = getRedisClient();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    // Check if this IP is in the blocked set
    const reason = await client.hget(BLOCKED_IPS_KEY, ip);
    if (reason) {
      return res.status(403).json({
        message: 'Access denied. Your IP address has been blocked.',
        reason
      });
    }

    next();
  } catch (err) {
    // If Redis is down, don't block legitimate traffic
    console.error('blockIP middleware error:', err.message);
    next();
  }
};

module.exports = { blockIP };
