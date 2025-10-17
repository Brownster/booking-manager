import { query } from '../config/database.js';

const permissionFields = `
  id,
  name,
  resource,
  action,
  description,
  created_at
`;

const mapPermission = (row) =>
  row && {
    id: row.id,
    name: row.name,
    resource: row.resource,
    action: row.action,
    description: row.description,
    created_at: row.created_at
  };

export const listPermissions = async () => {
  const { rows } = await query(`SELECT ${permissionFields} FROM permissions ORDER BY name ASC`);
  return rows.map(mapPermission);
};

export const getPermissionByName = async (name) => {
  const { rows } = await query(
    `SELECT ${permissionFields} FROM permissions WHERE name = $1 LIMIT 1`,
    [name]
  );
  return mapPermission(rows[0]);
};

export const getPermissionById = async (id) => {
  const { rows } = await query(
    `SELECT ${permissionFields} FROM permissions WHERE id = $1 LIMIT 1`,
    [id]
  );
  return mapPermission(rows[0]);
};

export const getPermissionsByIds = async (ids = []) => {
  if (!ids.length) {
    return [];
  }
  const { rows } = await query(
    `SELECT ${permissionFields} FROM permissions WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return rows.map(mapPermission);
};
