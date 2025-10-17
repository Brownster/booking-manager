import request from 'supertest';
import app from '../../src/app.js';
import { createTenant } from '../factories/tenantFactory.js';
import { createUserFactory } from '../factories/userFactory.js';
import { resetDatabase } from '../utils/resetDb.js';

const registerUser = async ({ tenantId, email, password, firstName = 'Test', lastName = 'User' }) =>
  request(app)
    .post('/api/v1/auth/register')
    .send({ tenantId, email, password, firstName, lastName });

describe('Auth Integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('registers a new user and returns tokens', async () => {
    const tenant = await createTenant();
    const res = await registerUser({
      tenantId: tenant.id,
      email: 'newuser@example.com',
      password: 'Str0ngPassw0rd!'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toMatchObject({
      email: 'newuser@example.com',
      tenant_id: tenant.id
    });
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')])
    );
  });

  it('prevents duplicate registration for same tenant/email', async () => {
    const tenant = await createTenant();
    const payload = {
      tenantId: tenant.id,
      email: 'dupe@example.com',
      password: 'Str0ngPassw0rd!'
    };

    await registerUser(payload);
    const res = await registerUser(payload);

    expect(res.statusCode).toBe(409);
  });

  it('authenticates an existing user', async () => {
    const tenant = await createTenant();
    const password = 'Str0ngPassw0rd!';
    const user = await createUserFactory({ tenantId: tenant.id, password });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ tenantId: tenant.id, email: user.email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')])
    );
  });

  it('rejects login with invalid credentials', async () => {
    const tenant = await createTenant();
    await createUserFactory({ tenantId: tenant.id, password: 'CorrectPass1!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ tenantId: tenant.id, email: 'invalid@example.com', password: 'WrongPass1!' });

    expect(res.statusCode).toBe(401);
  });

  it('allows access to /me with valid token', async () => {
    const tenant = await createTenant();
    const password = 'Str0ngPassw0rd!';
    const user = await createUserFactory({ tenantId: tenant.id, password });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ tenantId: tenant.id, email: user.email, password });

    const { accessToken } = loginRes.body.tokens;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user.email).toBe(user.email);
  });

  it('refreshes tokens using refresh token cookie', async () => {
    const tenant = await createTenant();
    const password = 'Str0ngPassw0rd!';
    const user = await createUserFactory({ tenantId: tenant.id, password });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ tenantId: tenant.id, email: user.email, password });

    const cookies = loginRes.headers['set-cookie'];

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies)
      .send();

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.tokens.accessToken).toBeDefined();
  });

  it('logs out user and revokes refresh token', async () => {
    const tenant = await createTenant();
    const password = 'Str0ngPassw0rd!';
    const user = await createUserFactory({ tenantId: tenant.id, password });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ tenantId: tenant.id, email: user.email, password });

    const { accessToken } = loginRes.body.tokens;
    const cookies = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies);

    expect(logoutRes.statusCode).toBe(200);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies)
      .send();

    expect(refreshRes.statusCode).toBe(401);
  });
});
