import { query, transaction } from '../config/database.js';

const calendarColumns = `
  id,
  tenant_id,
  provider_user_id,
  service_type,
  timezone,
  is_active,
  color,
  created_at,
  updated_at
`;

const mapCalendar = (row, skills = []) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    provider_user_id: row.provider_user_id,
    service_type: row.service_type,
    timezone: row.timezone,
    is_active: row.is_active,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at,
    skills
  };

const fetchCalendarSkills = async (client, calendarId) => {
  const { rows } = await client.query(
    `
      SELECT skill_id FROM calendar_skills WHERE calendar_id = $1
    `,
    [calendarId]
  );
  return rows.map((row) => row.skill_id);
};

export const createCalendar = async ({
  tenantId,
  providerUserId,
  serviceType,
  timezone,
  isActive = true,
  color,
  skillIds = []
}) => {
  return transaction(async (client) => {
    const { rows } = await client.query(
      `
        INSERT INTO calendars (
          tenant_id,
          provider_user_id,
          service_type,
          timezone,
          is_active,
          color
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${calendarColumns}
      `,
      [tenantId, providerUserId, serviceType, timezone, isActive, color]
    );

    const calendar = rows[0];

    if (skillIds.length) {
      const insertValues = skillIds.map((skillId, index) => `($1, $${index + 2})`).join(', ');
      await client.query(
        `INSERT INTO calendar_skills (calendar_id, skill_id) VALUES ${insertValues} ON CONFLICT DO NOTHING`,
        [calendar.id, ...skillIds]
      );
    }

    const skills = await fetchCalendarSkills(client, calendar.id);
    return mapCalendar(calendar, skills);
  });
};

export const getCalendarById = async (tenantId, calendarId) => {
  const { rows } = await query(
    `SELECT ${calendarColumns} FROM calendars WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, calendarId]
  );
  if (!rows[0]) {
    return null;
  }
  const skills = await query(
    `SELECT skill_id FROM calendar_skills WHERE calendar_id = $1`,
    [calendarId]
  );
  return mapCalendar(rows[0], skills.rows.map((row) => row.skill_id));
};

export const listCalendars = async (tenantId, { isActive, providerUserId } = {}) => {
  const params = [tenantId];
  let sql = `SELECT ${calendarColumns} FROM calendars WHERE tenant_id = $1`;

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    sql += ` AND is_active = $${params.length}`;
  }

  if (providerUserId) {
    params.push(providerUserId);
    sql += ` AND provider_user_id = $${params.length}`;
  }

  sql += ' ORDER BY service_type ASC';

  const { rows } = await query(sql, params);
  if (!rows.length) {
    return [];
  }

  const calendars = [];
  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    const skills = await query(`SELECT skill_id FROM calendar_skills WHERE calendar_id = $1`, [
      row.id
    ]);
    calendars.push(mapCalendar(row, skills.rows.map((skill) => skill.skill_id)));
  }

  return calendars;
};

export const updateCalendar = async (tenantId, calendarId, payload) => {
  const allowed = ['service_type', 'timezone', 'is_active', 'color', 'provider_user_id'];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));

  const fields = [];
  const values = [];
  let index = 1;

  entries.forEach(([key, value]) => {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  if (fields.length === 0 && !payload.skillIds) {
    return getCalendarById(tenantId, calendarId);
  }

  return transaction(async (client) => {
    if (fields.length) {
      values.push(tenantId, calendarId);
      await client.query(
        `
          UPDATE calendars
          SET ${fields.join(', ')}
          WHERE tenant_id = $${fields.length + 1}
            AND id = $${fields.length + 2}
        `,
        values
      );
    }

    if (Array.isArray(payload.skillIds)) {
      await client.query(`DELETE FROM calendar_skills WHERE calendar_id = $1`, [calendarId]);
      if (payload.skillIds.length) {
        const insertValues = payload.skillIds
          .map((skillId, idx) => `($1, $${idx + 2})`)
          .join(', ');
        await client.query(
          `INSERT INTO calendar_skills (calendar_id, skill_id) VALUES ${insertValues} ON CONFLICT DO NOTHING`,
          [calendarId, ...payload.skillIds]
        );
      }
    }

    const calendarResult = await client.query(
      `SELECT ${calendarColumns} FROM calendars WHERE tenant_id = $1 AND id = $2`,
      [tenantId, calendarId]
    );

    if (!calendarResult.rows[0]) {
      return null;
    }

    const skills = await fetchCalendarSkills(client, calendarId);
    return mapCalendar(calendarResult.rows[0], skills);
  });
};

export const deleteCalendar = async (tenantId, calendarId) => {
  const { rows } = await query(
    `DELETE FROM calendars WHERE tenant_id = $1 AND id = $2 RETURNING ${calendarColumns}`,
    [tenantId, calendarId]
  );
  return mapCalendar(rows[0]);
};
