import request from 'supertest';
import moment from 'moment-timezone';
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

const setupCalendar = async () => {
  const tenant = await createTenant();
  const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
  const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'Provider1!' });
  const client = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'Client1!' });
  const skill = await createSkillFactory({ tenantId: tenant.id, name: 'SkillA' });

  const auth = await loginAs({ tenantId: tenant.id, email: admin.email, password: 'AdminPass1!' });

  const calendarRes = await request(app)
    .post('/api/v1/calendars')
    .set('Authorization', `Bearer ${auth.accessToken}`)
    .send({
      providerUserId: provider.id,
      serviceType: 'Consultation',
      timezone: 'America/New_York',
      skillIds: [skill.id]
    });

  const calendarId = calendarRes.body.calendar.id;

  await request(app)
    .post(`/api/v1/availability/${calendarId}/slots`)
    .set('Authorization', `Bearer ${auth.accessToken}`)
    .send({ dayOfWeek: moment().day(), startTime: '09:00:00', endTime: '17:00:00' });

  return { tenant, admin, provider, client, auth, calendarId };
};

describe('Appointments API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates appointment and prevents conflicts', async () => {
    const { client, auth, calendarId } = await setupCalendar();
    const startTime = moment().add(1, 'day').hour(10).minute(0).second(0).utc().toISOString();
    const endTime = moment(startTime).add(1, 'hour').toISOString();

    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        calendarId,
        clientUserId: client.id,
        startTime,
        endTime
      });

    expect(createRes.statusCode).toBe(201);

    const conflictRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        calendarId,
        clientUserId: client.id,
        startTime: moment(startTime).add(30, 'minutes').toISOString(),
        endTime: moment(endTime).add(30, 'minutes').toISOString()
      });

    expect(conflictRes.statusCode).toBe(409);
  });

  it('updates and cancels appointments', async () => {
    const { client, auth, calendarId } = await setupCalendar();
    const startTime = moment().add(2, 'days').hour(12).minute(0).second(0).utc().toISOString();
    const endTime = moment(startTime).add(1, 'hour').toISOString();

    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        calendarId,
        clientUserId: client.id,
        startTime,
        endTime
      });

    const appointmentId = createRes.body.appointment.id;

    const updateRes = await request(app)
      .put(`/api/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ status: 'confirmed' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.appointment.status).toBe('confirmed');

    const cancelRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.appointment.status).toBe('cancelled');
  });
});
