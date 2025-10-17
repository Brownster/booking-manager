import dotenv from 'dotenv';
import app from './app.js';
import { createLogger } from './config/logger.js';
import { connectRedis } from './config/redis.js';
import { testConnection } from './config/database.js';

dotenv.config();

const PORT = process.env.BACKEND_PORT || 3000;
const logger = createLogger();

const start = async () => {
  try {
    const dbHealthy = await testConnection();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    await connectRedis();

    app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
      );
    });
  } catch (error) {
    logger.error('Startup error', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

start();
