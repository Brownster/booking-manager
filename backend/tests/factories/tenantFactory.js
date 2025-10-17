import { faker } from '@faker-js/faker';
import { query } from '../../src/config/database.js';

export const createTenant = async (overrides = {}) => {
  const tenant = {
    id: overrides.id || faker.string.uuid(),
    name: overrides.name || faker.company.name(),
    slug: overrides.slug || faker.helpers.slugify(faker.company.name()).toLowerCase()
  };

  const { rows } = await query(
    `
      INSERT INTO tenants (id, name, slug)
      VALUES ($1, $2, $3)
      RETURNING id, name, slug
    `,
    [tenant.id, tenant.name, tenant.slug]
  );

  return rows[0];
};
