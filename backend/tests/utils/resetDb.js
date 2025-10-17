import { pool } from '../../src/config/database.js';

const TABLES_IN_ORDER = [
  'waitlist_entries',
  'token_blacklist',
  'appointments',
  'availability_slots',
  'calendar_skills',
  'calendars',
  'skills',
  'users',
  'tenants'
];

export const resetDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of TABLES_IN_ORDER) {
      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
