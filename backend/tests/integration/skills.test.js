import request from 'supertest';
import app from '../../src/app.js';
import { createTenant } from '../factories/tenantFactory.js';
import { createUserFactory } from '../factories/userFactory.js';
import { resetDatabase } from '../utils/resetDb.js';

const loginAs = async ({ tenantId, email, password }) => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ tenantId, email, password });

  return {
    accessToken: res.body.tokens.accessToken,
    cookies: res.headers['set-cookie']
  };
};

describe('Skills API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('allows admin to create and list skills', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const createRes = await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name: 'Hair Styling', category: 'Beauty' });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.skill.name).toBe('Hair Styling');

    const listRes = await request(app)
      .get('/api/v1/skills')
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.skills).toHaveLength(1);
  });

  it('prevents duplicate skill names per tenant', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name: 'Massage', category: 'Wellness' });

    const duplicateRes = await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name: 'Massage', category: 'Wellness' });

    expect(duplicateRes.statusCode).toBe(409);
  });

  it('allows admin to update and delete skills', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const createRes = await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name: 'Physio', category: 'Health' });

    const { id } = createRes.body.skill;

    const updateRes = await request(app)
      .put(`/api/v1/skills/${id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ description: 'Physical therapy' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.skill.description).toBe('Physical therapy');

    const deleteRes = await request(app)
      .delete(`/api/v1/skills/${id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(deleteRes.statusCode).toBe(204);
  });

  it('restricts non-admin users from creating skills', async () => {
    const tenant = await createTenant();
    const user = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'UserPass1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: user.email, password: 'UserPass1!' });

    const res = await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name: 'Test Skill' });

    expect(res.statusCode).toBe(403);
  });
});
