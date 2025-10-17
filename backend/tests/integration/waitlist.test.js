import request from 'supertest';
import app from '../../src/app.js';
import { createTenant } from '../factories/tenantFactory.js';
import { createUserFactory } from '../factories/userFactory.js';
import { resetDatabase } from '../utils/resetDb.js';

const loginAs = async ({ tenantId, email, password }) => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ tenantId, email, password });

  return {
    accessToken: response.body.tokens.accessToken
  };
};

describe('Waitlist API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('allows admin to create and list waitlist entries', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const client = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'ClientPass1!' });
    const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'ProviderPass1!' });

    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const createRes = await request(app)
      .post('/api/v1/waitlist')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        clientUserId: client.id,
        providerUserId: provider.id,
        priority: 'high',
        requestedStart: '2025-11-01T14:00:00Z',
        requestedEnd: '2025-11-01T17:00:00Z',
        autoPromote: true,
        notes: 'Prefers afternoon slots'
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.entry.priority).toBe('high');

    const listRes = await request(app)
      .get('/api/v1/waitlist')
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.entries).toHaveLength(1);
  });

  it('allows promotion and cancellation of waitlist entry', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const client = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'ClientPass1!' });

    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const createRes = await request(app)
      .post('/api/v1/waitlist')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ clientUserId: client.id });

    const { id } = createRes.body.entry;

    const promoteRes = await request(app)
      .post(`/api/v1/waitlist/${id}/promote`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(promoteRes.statusCode).toBe(200);
    expect(promoteRes.body.entry.status).toBe('promoted');

    const cancelRes = await request(app)
      .post(`/api/v1/waitlist/${id}/cancel`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ reason: 'Client booked elsewhere' });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.entry.status).toBe('cancelled');
  });

  it('enforces permission checks for waitlist creation', async () => {
    const tenant = await createTenant();
    const user = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'UserPass1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: user.email, password: 'UserPass1!' });

    const res = await request(app)
      .post('/api/v1/waitlist')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ clientUserId: user.id });

    expect(res.statusCode).toBe(403);
  });
});
