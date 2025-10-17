import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createLogger } from './config/logger.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const logger = createLogger();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (skip noisy in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http?.(message.trim()) || logger.info(message.trim())
      }
    })
  );
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API base docs
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Calendar Booking System API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Feature routes
registerRoutes(app);

// 404 handler for API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      error: {
        message: 'Route not found',
        status: 404,
        path: req.path
      }
    });
    return;
  }
  next();
});

// Global error handler
app.use(errorHandler);

export default app;
