import { query } from '../config/database.js';

const userFields = `
  id,
  tenant_id,
  email,
  first_name,
  last_name,
  role,
  status,
  email_verified,
  last_login_at,
  created_at,
  updated_at
`;

const mapUser = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    status: row.status,
    email_verified: row.email_verified,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

export const createUser = async ({
  tenantId,
  email,
  passwordHash,
  firstName,
  lastName,
  role = 'user',
  status = 'active'
}) => {
  const { rows } = await query(
    `
      INSERT INTO users (
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${userFields}
    `,
    [tenantId, email, passwordHash, firstName, lastName, role, status]
  );

  return mapUser(rows[0]);
};

export const findByEmail = async (tenantId, email) => {
  const { rows } = await query(
    `SELECT ${userFields}, password_hash FROM users WHERE tenant_id = $1 AND email = $2 LIMIT 1`,
    [tenantId, email]
  );
  return rows[0]
    ? {
        ...mapUser(rows[0]),
        password_hash: rows[0].password_hash
      }
    : null;
};

export const findById = async (id) => {
  const { rows } = await query(`SELECT ${userFields} FROM users WHERE id = $1 LIMIT 1`, [id]);
  return mapUser(rows[0]);
};

export const updateLastLogin = async (id) => {
  const { rows } = await query(
    `UPDATE users SET last_login_at = NOW() WHERE id = $1 RETURNING ${userFields}`,
    [id]
  );
  return mapUser(rows[0]);
};

export const updateStatus = async (id, status) => {
  const { rows } = await query(
    `UPDATE users SET status = $2 WHERE id = $1 RETURNING ${userFields}`,
    [id, status]
  );
  return mapUser(rows[0]);
};

export const listByTenant = async (tenantId, { limit = 50, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT ${userFields} FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [tenantId, limit, offset]
  );
  return rows.map(mapUser);
};
