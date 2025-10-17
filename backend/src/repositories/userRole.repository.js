import { query } from '../config/database.js';

export const assignRoleToUser = async ({ userId, roleId, assignedBy, expiresAt }) => {
  await query(
    `
      INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, role_id)
      DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = NOW(),
        expires_at = EXCLUDED.expires_at
    `,
    [userId, roleId, assignedBy || null, expiresAt || null]
  );
};

export const removeRoleFromUser = async ({ userId, roleId }) => {
  await query(`DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`, [userId, roleId]);
};

export const listUserRoles = async ({ userId, tenantId }) => {
  const { rows } = await query(
    `
      SELECT
        r.id,
        r.name,
        r.description,
        r.is_system,
        r.tenant_id,
        ur.assigned_at,
        ur.assigned_by,
        ur.expires_at
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND r.tenant_id = $2
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY r.is_system DESC, r.name ASC
    `,
    [userId, tenantId]
  );

  return rows;
};

export const getUserIdsByRole = async ({ tenantId, roleId }) => {
  const { rows } = await query(
    `
      SELECT ur.user_id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.tenant_id = $1
        AND r.id = $2
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `,
    [tenantId, roleId]
  );

  return rows.map((row) => row.user_id);
};

export const getUserPermissions = async ({ userId, tenantId }) => {
  const { rows } = await query(
    `
      SELECT DISTINCT p.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = $1
        AND r.tenant_id = $2
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `,
    [userId, tenantId]
  );

  return rows.map((row) => row.name);
};
