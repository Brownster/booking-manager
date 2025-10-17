import { query } from '../config/database.js';

export const blacklistToken = async ({ token, expiresAt }) => {
  await query(
    `
      INSERT INTO token_blacklist (token, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at
    `,
    [token, expiresAt]
  );
};

export const isTokenBlacklisted = async (token) => {
  const { rows } = await query(
    `SELECT id FROM token_blacklist WHERE token = $1 AND expires_at > NOW() LIMIT 1`,
    [token]
  );
  return rows.length > 0;
};

export const purgeExpiredTokens = async () => {
  await query(`DELETE FROM token_blacklist WHERE expires_at <= NOW()`);
};
