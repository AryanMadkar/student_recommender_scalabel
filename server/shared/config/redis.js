const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

  } catch (error) {
    logger.error('Redis connection failed:', error);
  }
};

// Cache helper functions
const cache = {
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  set: async (key, data, expireInSeconds = 3600) => {
    try {
      await redisClient.setex(key, expireInSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  flushAll: async () => {
    try {
      await redisClient.flushall();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
};

module.exports = { connectRedis, redisClient, cache };
