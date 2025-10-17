import { query, transaction } from '../config/database.js';

const roleFields = `
  id,
  tenant_id,
  name,
  description,
  is_system,
  created_at,
  updated_at
`;

const mapRole = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    description: row.description,
    is_system: row.is_system,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

export const createRole = async ({ tenantId, name, description, isSystem = false }) => {
  const { rows } = await query(
    `
      INSERT INTO roles (tenant_id, name, description, is_system)
      VALUES ($1, $2, $3, $4)
      RETURNING ${roleFields}
    `,
    [tenantId, name, description || null, isSystem]
  );
  return mapRole(rows[0]);
};

export const getRoleById = async (tenantId, roleId) => {
  const { rows } = await query(
    `SELECT ${roleFields} FROM roles WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, roleId]
  );
  return mapRole(rows[0]);
};

export const getRoleByName = async (tenantId, name) => {
  const { rows } = await query(
    `SELECT ${roleFields} FROM roles WHERE tenant_id = $1 AND name = $2 LIMIT 1`,
    [tenantId, name]
  );
  return mapRole(rows[0]);
};

export const listRoles = async (tenantId) => {
  const { rows } = await query(
    `SELECT ${roleFields} FROM roles WHERE tenant_id = $1 ORDER BY is_system DESC, name ASC`,
    [tenantId]
  );
  return rows.map(mapRole);
};

export const deleteRole = async (tenantId, roleId) => {
  const { rows } = await query(
    `DELETE FROM roles WHERE tenant_id = $1 AND id = $2 AND is_system = FALSE RETURNING ${roleFields}`,
    [tenantId, roleId]
  );
  return mapRole(rows[0]);
};

export const updateRole = async (tenantId, roleId, updates) => {
  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  if (!fields.length) {
    return getRoleById(tenantId, roleId);
  }

  values.push(tenantId, roleId);

  const { rows } = await query(
    `
      UPDATE roles
      SET ${fields.join(', ')}
      WHERE tenant_id = $${fields.length + 1}
        AND id = $${fields.length + 2}
        AND is_system = FALSE
      RETURNING ${roleFields}
    `,
    values
  );

  return mapRole(rows[0]);
};

export const getRoleWithPermissions = async (tenantId, roleId) => {
  const { rows } = await query(
    `
      SELECT
        ${roleFields},
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', p.id,
                'name', p.name,
                'resource', p.resource,
                'action', p.action
              )
            )
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = roles.id
          ),
          '[]'::json
        ) AS permissions
      FROM roles
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [tenantId, roleId]
  );

  if (!rows[0]) {
    return null;
  }

  const { permissions, ...role } = rows[0];
  return {
    ...mapRole(role),
    permissions
  };
};

export const createRoleWithPermissions = async ({
  tenantId,
  name,
  description,
  permissionIds,
  isSystem = false,
  grantedBy
}) =>
  transaction(async (client) => {
    const roleResult = await client.query(
      `
        INSERT INTO roles (tenant_id, name, description, is_system)
        VALUES ($1, $2, $3, $4)
        RETURNING ${roleFields}
      `,
      [tenantId, name, description || null, isSystem]
    );

    const role = roleResult.rows[0];

    if (permissionIds?.length) {
      const placeholders = permissionIds.map((_, idx) => `($1, $${idx + 2}, $${permissionIds.length + 2})`).join(', ');
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ${placeholders}`,
        [role.id, ...permissionIds, grantedBy || null]
      );
    }

    return mapRole(role);
  });
