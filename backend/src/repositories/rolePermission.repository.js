import { query } from '../config/database.js';

export const addPermissionsToRole = async ({ roleId, permissionIds, grantedBy }) => {
  if (!permissionIds?.length) {
    return [];
  }

  const placeholders = permissionIds
    .map((_, index) => `($1, $${index + 2}, $${permissionIds.length + 2})`)
    .join(', ');

  await query(
    `
      INSERT INTO role_permissions (role_id, permission_id, granted_by)
      VALUES ${placeholders}
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `,
    [roleId, ...permissionIds, grantedBy || null]
  );
};

export const removePermissionsFromRole = async ({ roleId, permissionIds }) => {
  if (!permissionIds?.length) {
    return;
  }

  await query(
    `
      DELETE FROM role_permissions
      WHERE role_id = $1
        AND permission_id = ANY($2::uuid[])
    `,
    [roleId, permissionIds]
  );
};

export const listRolePermissions = async (roleId) => {
  const { rows } = await query(
    `
      SELECT permission_id
      FROM role_permissions
      WHERE role_id = $1
    `,
    [roleId]
  );
  return rows.map((row) => row.permission_id);
};
