import { query } from '../config/database.js';

const slotColumns = `
  id,
  calendar_id,
  day_of_week,
  start_time,
  end_time,
  capacity,
  metadata,
  created_at,
  updated_at
`;

const mapSlot = (row) =>
  row && {
    id: row.id,
    calendar_id: row.calendar_id,
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    capacity: row.capacity,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

const mapCalendarAvailability = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    provider_user_id: row.provider_user_id,
    timezone: row.timezone,
    is_active: row.is_active,
    skills: row.skill_ids || []
  };

const mapAppointment = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    calendar_id: row.calendar_id,
    client_user_id: row.client_user_id,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status
  };

export const createAvailabilitySlot = async ({
  calendarId,
  dayOfWeek,
  startTime,
  endTime,
  capacity,
  metadata
}) => {
  const { rows } = await query(
    `
      INSERT INTO availability_slots (
        calendar_id,
        day_of_week,
        start_time,
        end_time,
        capacity,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${slotColumns}
    `,
    [calendarId, dayOfWeek, startTime, endTime, capacity, metadata]
  );
  return mapSlot(rows[0]);
};

export const getAvailabilitySlotById = async (slotId) => {
  const { rows } = await query(`SELECT ${slotColumns} FROM availability_slots WHERE id = $1`, [
    slotId
  ]);
  return mapSlot(rows[0]);
};

export const listAvailabilitySlotsByCalendar = async (calendarId) => {
  const { rows } = await query(
    `SELECT ${slotColumns} FROM availability_slots WHERE calendar_id = $1 ORDER BY day_of_week, start_time`,
    [calendarId]
  );
  return rows.map(mapSlot);
};

export const updateAvailabilitySlot = async (slotId, payload) => {
  const allowed = ['day_of_week', 'start_time', 'end_time', 'capacity', 'metadata'];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));
  if (!entries.length) {
    return getAvailabilitySlotById(slotId);
  }

  const fields = [];
  const values = [];
  let index = 1;

  entries.forEach(([key, value]) => {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  values.push(slotId);

  const { rows } = await query(
    `
      UPDATE availability_slots
      SET ${fields.join(', ')}
      WHERE id = $${fields.length + 1}
      RETURNING ${slotColumns}
    `,
    values
  );

  return mapSlot(rows[0]);
};

export const deleteAvailabilitySlot = async (slotId) => {
  const { rows } = await query(
    `DELETE FROM availability_slots WHERE id = $1 RETURNING ${slotColumns}`,
    [slotId]
  );
  return mapSlot(rows[0]);
};

export const findCalendarsForAvailability = async (tenantId) => {
  const { rows } = await query(
    `
      SELECT
        c.id,
        c.tenant_id,
        c.provider_user_id,
        c.timezone,
        c.is_active,
        COALESCE(
          (
            SELECT ARRAY_AGG(skill_id ORDER BY skill_id)
            FROM calendar_skills cs
            WHERE cs.calendar_id = c.id
          ),
          '{}'
        ) AS skill_ids
      FROM calendars c
      WHERE c.tenant_id = $1
        AND c.is_active = TRUE
    `,
    [tenantId]
  );

  return rows.map(mapCalendarAvailability);
};

export const findSlotsForCalendars = async (calendarIds) => {
  if (!calendarIds.length) {
    return [];
  }
  const { rows } = await query(
    `
      SELECT ${slotColumns}
      FROM availability_slots
      WHERE calendar_id = ANY($1::uuid[])
      ORDER BY calendar_id, day_of_week, start_time
    `,
    [calendarIds]
  );

  return rows.map(mapSlot);
};

export const findAppointmentsForCalendars = async (calendarIds, startTime, endTime) => {
  if (!calendarIds.length) {
    return [];
  }

  const { rows } = await query(
    `
      SELECT ${appointmentColumns()}
      FROM appointments
      WHERE calendar_id = ANY($1::uuid[])
        AND status IN ('pending', 'confirmed')
        AND NOT (end_time <= $2 OR start_time >= $3)
    `,
    [calendarIds, startTime, endTime]
  );

  return rows.map(mapAppointment);
};

const appointmentColumns = () => `
  id,
  tenant_id,
  calendar_id,
  client_user_id,
  start_time,
  end_time,
  status,
  required_skills,
  notes,
  metadata,
  created_at,
  updated_at
`;
