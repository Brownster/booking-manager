import request from 'supertest';
import app from '../../src/app.js';
import { createTenant } from '../factories/tenantFactory.js';
import { createUserFactory } from '../factories/userFactory.js';
import { createSkillFactory } from '../factories/skillFactory.js';
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

describe('Calendars API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates calendar with skills for tenant', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'Provider1!' });
    const skill = await createSkillFactory({ tenantId: tenant.id, name: 'Massage' });

    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const res = await request(app)
      .post('/api/v1/calendars')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        providerUserId: provider.id,
        serviceType: 'Massage Therapy',
        timezone: 'America/New_York',
        skillIds: [skill.id]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.calendar.skills).toContain(skill.id);
    expect(res.body.calendar.provider_user_id).toBe(provider.id);
  });

  it('rejects invalid timezone', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'Provider1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const res = await request(app)
      .post('/api/v1/calendars')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        providerUserId: provider.id,
        serviceType: 'Invalid Timezone',
        timezone: 'Mars/Olympus'
      });

    expect(res.statusCode).toBe(422);
  });

  it('updates calendar skills and status', async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'Provider1!' });
    const skillA = await createSkillFactory({ tenantId: tenant.id, name: 'Skill A' });
    const skillB = await createSkillFactory({ tenantId: tenant.id, name: 'Skill B' });
    const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

    const createRes = await request(app)
      .post('/api/v1/calendars')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        providerUserId: provider.id,
        serviceType: 'Service',
        timezone: 'America/New_York',
        skillIds: [skillA.id]
      });

    const updateRes = await request(app)
      .put(`/api/v1/calendars/${createRes.body.calendar.id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        isActive: false,
        skillIds: [skillB.id]
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.calendar.is_active).toBe(false);
    expect(updateRes.body.calendar.skills).toEqual([skillB.id]);
  });

  it('prevents non-admin from creating calendars', async () => {
    const tenant = await createTenant();
    const user = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'UserPass1!' });
    const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'Provider1!' });
    const auth = await loginAs({ tenantId: tenant.id, email: user.email, password: 'UserPass1!' });

    const res = await request(app)
      .post('/api/v1/calendars')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        providerUserId: provider.id,
        serviceType: 'Service',
        timezone: 'America/New_York'
      });

    expect(res.statusCode).toBe(403);
  });
});
