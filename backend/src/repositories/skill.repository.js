import { query } from '../config/database.js';

const skillColumns = `
  id,
  tenant_id,
  name,
  category,
  description,
  created_at,
  updated_at
`;

const mapSkill = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    category: row.category,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

export const createSkill = async ({ tenantId, name, category, description }) => {
  const { rows } = await query(
    `
      INSERT INTO skills (tenant_id, name, category, description)
      VALUES ($1, $2, $3, $4)
      RETURNING ${skillColumns}
    `,
    [tenantId, name, category, description]
  );
  return mapSkill(rows[0]);
};

export const getSkillById = async (tenantId, skillId) => {
  const { rows } = await query(
    `SELECT ${skillColumns} FROM skills WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, skillId]
  );
  return mapSkill(rows[0]);
};

export const getSkillByName = async (tenantId, name) => {
  const { rows } = await query(
    `SELECT ${skillColumns} FROM skills WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [tenantId, name]
  );
  return mapSkill(rows[0]);
};

export const listSkills = async (tenantId, { search, limit = 50, offset = 0 } = {}) => {
  let sql = `SELECT ${skillColumns} FROM skills WHERE tenant_id = $1`;
  const params = [tenantId];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    sql += ` AND LOWER(name) LIKE $${params.length}`;
  }

  params.push(limit, offset);
  sql += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await query(sql, params);
  return rows.map(mapSkill);
};

export const findSkillsByIds = async (tenantId, skillIds = []) => {
  if (!skillIds.length) {
    return [];
  }

  const { rows } = await query(
    `SELECT ${skillColumns} FROM skills WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
    [tenantId, skillIds]
  );
  return rows.map(mapSkill);
};

export const updateSkill = async (tenantId, skillId, payload) => {
  const allowed = ['name', 'category', 'description'];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));

  const fields = [];
  const values = [];
  let index = 1;

  entries.forEach(([key, value]) => {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  if (fields.length === 0) {
    return getSkillById(tenantId, skillId);
  }

  values.push(tenantId, skillId);

  const { rows } = await query(
    `
      UPDATE skills
      SET ${fields.join(', ')}
      WHERE tenant_id = $${fields.length + 1}
        AND id = $${fields.length + 2}
      RETURNING ${skillColumns}
    `,
    values
  );

  return mapSkill(rows[0]);
};

export const deleteSkill = async (tenantId, skillId) => {
  const { rows } = await query(
    `DELETE FROM skills WHERE tenant_id = $1 AND id = $2 RETURNING ${skillColumns}`,
    [tenantId, skillId]
  );
  return mapSkill(rows[0]);
};
