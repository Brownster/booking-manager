import { faker } from '@faker-js/faker';
import { query } from '../../src/config/database.js';
import { hashPassword } from '../../src/utils/password.js';

export const createUserFactory = async ({ tenantId, role = 'user', status = 'active', password } = {}) => {
  if (!tenantId) {
    throw new Error('tenantId is required to create a user');
  }

  const plainPassword = password || faker.internet.password({ length: 12, prefix: 'A1' });
  const passwordHash = await hashPassword(plainPassword);

  const user = {
    id: faker.string.uuid(),
    tenant_id: tenantId,
    email: faker.internet.email().toLowerCase(),
    password_hash: passwordHash,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    role,
    status
  };

  const { rows } = await query(
    `
      INSERT INTO users (
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      user.id,
      user.tenant_id,
      user.email,
      user.password_hash,
      user.first_name,
      user.last_name,
      user.role,
      user.status
    ]
  );

  return {
    ...rows[0],
    plainPassword
  };
};
