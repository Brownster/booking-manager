import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// IMPORTANT: Set NODE_ENV before any imports that use it
process.env.NODE_ENV = 'test';
process.env.POSTGRES_TEST_HOST = process.env.POSTGRES_TEST_HOST || 'localhost';
process.env.POSTGRES_TEST_PORT = process.env.POSTGRES_TEST_PORT || '5433';
process.env.POSTGRES_TEST_DB = process.env.POSTGRES_TEST_DB || 'booking_system_test';
process.env.POSTGRES_TEST_USER = process.env.POSTGRES_TEST_USER || 'booking_user';
process.env.POSTGRES_TEST_PASSWORD =
  process.env.POSTGRES_TEST_PASSWORD || 'booking_password';
process.env.REDIS_TEST_URL =
  process.env.REDIS_TEST_URL || 'redis://:redis_password@localhost:6380';

// Load environment variables
dotenv.config({ path: '../.env' });

import { pool } from '../src/config/database.js';
import { redisClient } from '../src/config/redis.js';
import { applyMigrations } from '../src/config/migrations/migrate.js';
import { resetDatabase } from './utils/resetDb.js';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup test database and clean state before suites
beforeAll(async () => {
  await applyMigrations();
  await resetDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  await resetDatabase();
  await pool.end();
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
