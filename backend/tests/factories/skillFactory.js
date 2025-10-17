import { faker } from '@faker-js/faker';
import { query } from '../../src/config/database.js';

export const createSkillFactory = async ({ tenantId, name, category, description } = {}) => {
  const skill = {
    id: faker.string.uuid(),
    tenant_id: tenantId,
    name: name || faker.person.jobTitle(),
    category: category || faker.commerce.department(),
    description: description || faker.lorem.sentence()
  };

  const { rows } = await query(
    `
      INSERT INTO skills (id, tenant_id, name, category, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [skill.id, skill.tenant_id, skill.name, skill.category, skill.description]
  );

  return rows[0];
};
