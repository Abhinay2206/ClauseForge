const Redis = require('ioredis');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  return redisClient;
};

module.exports = {
  getRedisClient
};
