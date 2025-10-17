import { query } from '../config/database.js';

const tenantFields = `
  id,
  name,
  slug,
  created_at,
  updated_at
`;

const mapTenant = (row) =>
  row && {
    id: row.id,
    name: row.name,
    slug: row.slug,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

export const findTenantById = async (id) => {
  const { rows } = await query(`SELECT ${tenantFields} FROM tenants WHERE id = $1 LIMIT 1`, [id]);
  return mapTenant(rows[0]);
};

export const findTenantBySlug = async (slug) => {
  const { rows } = await query(`SELECT ${tenantFields} FROM tenants WHERE slug = $1 LIMIT 1`, [slug]);
  return mapTenant(rows[0]);
};

export const ensureTenantExists = async (tenantId) => {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    const error = new Error('Tenant not found');
    error.status = 404;
    throw error;
  }
  return tenant;
};

export const listTenantIds = async () => {
  const { rows } = await query('SELECT id FROM tenants');
  return rows.map((row) => row.id);
};
