import moment from 'moment-timezone';
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

describe('Availability Slots API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const setupCalendar = async () => {
    const tenant = await createTenant();
    const admin = await createUserFactory({ tenantId: tenant.id, role: 'admin', password: 'AdminPass1!' });
    const provider = await createUserFactory({ tenantId: tenant.id, role: 'provider', password: 'Provider1!' });
    const skill = await createSkillFactory({ tenantId: tenant.id, name: 'SkillA' });
    const client = await createUserFactory({ tenantId: tenant.id, role: 'user', password: 'ClientPass1!' });

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

    return { tenant, admin, provider, client, skill, auth, calendar: calendarRes.body.calendar };
  };

  it('creates and lists availability slots', async () => {
    const { auth, calendar } = await setupCalendar();

    const createRes = await request(app)
      .post(`/api/v1/availability/${calendar.id}/slots`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        dayOfWeek: 1,
        startTime: '09:00:00',
        endTime: '12:00:00',
        capacity: 2
      });

    expect(createRes.statusCode).toBe(201);

    const listRes = await request(app)
      .get(`/api/v1/availability/${calendar.id}/slots`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.slots).toHaveLength(1);
  });

  it('prevents overlapping slots', async () => {
    const { auth, calendar } = await setupCalendar();

    await request(app)
      .post(`/api/v1/availability/${calendar.id}/slots`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ dayOfWeek: 2, startTime: '10:00:00', endTime: '12:00:00' });

    const overlapRes = await request(app)
      .post(`/api/v1/availability/${calendar.id}/slots`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ dayOfWeek: 2, startTime: '11:00:00', endTime: '13:00:00' });

    expect(overlapRes.statusCode).toBe(400);
  });

  it('updates and deletes a slot', async () => {
    const { auth, calendar } = await setupCalendar();

    const createRes = await request(app)
      .post(`/api/v1/availability/${calendar.id}/slots`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ dayOfWeek: 3, startTime: '08:00:00', endTime: '10:00:00' });

    const slotId = createRes.body.slot.id;

    const updateRes = await request(app)
      .put(`/api/v1/availability/${calendar.id}/slots/${slotId}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ startTime: '08:30:00', endTime: '10:30:00' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.slot.start_time).toBe('08:30:00');

    const deleteRes = await request(app)
      .delete(`/api/v1/availability/${calendar.id}/slots/${slotId}`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    expect(deleteRes.statusCode).toBe(204);
  });

  it('searches availability excluding conflicting appointments', async () => {
    const { auth, calendar, client, skill } = await setupCalendar();

    await request(app)
      .post(`/api/v1/availability/${calendar.id}/slots`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00', capacity: 1 });

    const timezone = 'America/New_York';
    const baseStart = moment.tz('2025-01-06 09:00', timezone); // Monday
    const appointmentStart = baseStart.clone().add(1, 'hour');
    const appointmentEnd = appointmentStart.clone().add(1, 'hour');

    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        calendarId: calendar.id,
        clientUserId: client.id,
        startTime: appointmentStart.clone().utc().toISOString(),
        endTime: appointmentEnd.clone().utc().toISOString()
      });

    const searchRes = await request(app)
      .post('/api/v1/availability/search')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        start: baseStart.clone().utc().toISOString(),
        end: baseStart.clone().add(3, 'hours').utc().toISOString(),
        duration: 60,
        timezone,
        skillIds: [skill.id]
      });

    expect(searchRes.statusCode).toBe(200);
    const { availability } = searchRes.body;
    expect(Array.isArray(availability)).toBe(true);
    // Should return slots at 9-10 and 11-12, but not 10-11 due to conflict
    const slots = availability.map((slot) => ({
      start: slot.start,
      end: slot.end
    }));
    expect(slots).toEqual([
      {
        start: baseStart.clone().utc().toISOString(),
        end: baseStart.clone().add(1, 'hour').utc().toISOString()
      },
      {
        start: appointmentEnd.clone().utc().toISOString(),
        end: appointmentEnd.clone().add(1, 'hour').utc().toISOString()
      }
    ]);
  });
});
