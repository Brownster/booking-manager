import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection pool configuration
const isTest = process.env.NODE_ENV === 'test';
const poolConfig = isTest
  ? {
      host: process.env.POSTGRES_TEST_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(
        process.env.POSTGRES_TEST_PORT || process.env.POSTGRES_PORT || '5432',
        10
      ),
      database: process.env.POSTGRES_TEST_DB || 'booking_system_test',
      user: process.env.POSTGRES_TEST_USER || process.env.POSTGRES_USER || 'booking_user',
      password:
        process.env.POSTGRES_TEST_PASSWORD || process.env.POSTGRES_PASSWORD || 'booking_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  : {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    };

// Create connection pool
export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
};

// Query helper function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
