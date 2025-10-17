import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.join(__dirname, 'sql');

const MIGRATIONS_TABLE = '_migrations';

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const getAppliedMigrations = async () => {
  const { rows } = await pool.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name ASC;`);
  return rows.map((row) => row.name);
};

const getMigrationFiles = async () => {
  try {
    const files = await fs.readdir(SQL_DIR);
    return files
      .filter((file) => file.endsWith('.sql'))
      .sort();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
};

export const applyMigrations = async () => {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  const pending = files.filter((file) => !applied.includes(file));

  for (const migration of pending) {
    const sqlPath = path.join(SQL_DIR, migration);
    const sql = await fs.readFile(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1);`, [migration]);
      await client.query('COMMIT');
      console.log(`Applied migration: ${migration}`); // eslint-disable-line no-console
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Failed migration: ${migration}`, error); // eslint-disable-line no-console
      throw error;
    } finally {
      client.release();
    }
  }

  if (pending.length === 0) {
    console.log('No migrations to apply.'); // eslint-disable-line no-console
  }
};

export const rollbackLastMigration = async () => {
  await ensureMigrationsTable();
  const { rows } = await pool.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at DESC LIMIT 1;`
  );

  if (rows.length === 0) {
    console.log('No migrations to rollback.'); // eslint-disable-line no-console
    return;
  }

  const [name] = rows;
  const downPath = path.join(SQL_DIR, name.name.replace('.sql', '.down.sql'));

  try {
    const downSql = await fs.readFile(downPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(downSql);
      await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1;`, [name.name]);
      await client.query('COMMIT');
      console.log(`Rolled back migration: ${name.name}`); // eslint-disable-line no-console
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`No rollback script for migration: ${name.name}`); // eslint-disable-line no-console
      return;
    }
    throw err;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'up';
  if (command === 'up') {
    applyMigrations()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Migration failed', error); // eslint-disable-line no-console
        process.exit(1);
      });
  } else if (command === 'down') {
    rollbackLastMigration()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Rollback failed', error); // eslint-disable-line no-console
        process.exit(1);
      });
  } else {
    console.error(`Unknown command: ${command}`); // eslint-disable-line no-console
    process.exit(1);
  }
}
