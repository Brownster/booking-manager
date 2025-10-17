import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const redisUrl = isTest
  ? process.env.REDIS_TEST_URL || 'redis://:redis_password@localhost:6380'
  : process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Redis connection retry limit exceeded');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    return true;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    return false;
  }
};

// Cache helper functions
export const cacheGet = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

export const cacheSet = async (key, value, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Cache set error:', err);
    return false;
  }
};

export const cacheDel = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.error('Cache delete error:', err);
    return false;
  }
};

export const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (err) {
    console.error('Cache delete pattern error:', err);
    return false;
  }
};

export default redisClient;
