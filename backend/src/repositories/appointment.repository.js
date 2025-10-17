import { query } from '../config/database.js';

const appointmentColumns = `
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

const mapAppointment = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    calendar_id: row.calendar_id,
    client_user_id: row.client_user_id,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    required_skills: row.required_skills,
    notes: row.notes,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

export const createAppointment = async ({
  tenantId,
  calendarId,
  clientUserId,
  startTime,
  endTime,
  status = 'pending',
  requiredSkills = [],
  notes,
  metadata
}) => {
  const { rows } = await query(
    `
      INSERT INTO appointments (
        tenant_id,
        calendar_id,
        client_user_id,
        start_time,
        end_time,
        status,
        required_skills,
        notes,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${appointmentColumns}
    `,
    [
      tenantId,
      calendarId,
      clientUserId,
      startTime,
      endTime,
      status,
      requiredSkills,
      notes,
      metadata
    ]
  );
  return mapAppointment(rows[0]);
};

export const getAppointmentById = async (tenantId, appointmentId) => {
  const { rows } = await query(
    `SELECT ${appointmentColumns} FROM appointments WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, appointmentId]
  );
  return mapAppointment(rows[0]);
};

export const listAppointmentsForCalendar = async (tenantId, calendarId, { start, end } = {}) => {
  const params = [tenantId, calendarId];
  let sql = `SELECT ${appointmentColumns} FROM appointments WHERE tenant_id = $1 AND calendar_id = $2`;

  if (start) {
    params.push(start);
    sql += ` AND end_time > $${params.length}`;
  }

  if (end) {
    params.push(end);
    sql += ` AND start_time < $${params.length}`;
  }

  sql += ' ORDER BY start_time ASC';

  const { rows } = await query(sql, params);
  return rows.map(mapAppointment);
};

export const findConflictingAppointments = async (calendarId, startTime, endTime, ignoreAppointmentId) => {
  const params = [calendarId, startTime, endTime];
  let sql = `
    SELECT ${appointmentColumns}
    FROM appointments
    WHERE calendar_id = $1
      AND status IN ('pending', 'confirmed')
      AND NOT (end_time <= $2 OR start_time >= $3)
  `;

  if (ignoreAppointmentId) {
    params.push(ignoreAppointmentId);
    sql += ` AND id <> $${params.length}`;
  }

  const { rows } = await query(sql, params);
  return rows.map(mapAppointment);
};

export const updateAppointment = async (tenantId, appointmentId, payload) => {
  const allowed = ['status', 'start_time', 'end_time', 'notes', 'metadata'];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));
  if (!entries.length) {
    return getAppointmentById(tenantId, appointmentId);
  }

  const fields = [];
  const values = [];
  let index = 1;

  entries.forEach(([key, value]) => {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  values.push(tenantId, appointmentId);

  const { rows } = await query(
    `
      UPDATE appointments
      SET ${fields.join(', ')}
      WHERE tenant_id = $${fields.length + 1}
        AND id = $${fields.length + 2}
      RETURNING ${appointmentColumns}
    `,
    values
  );

  return mapAppointment(rows[0]);
};

export const deleteAppointment = async (tenantId, appointmentId) => {
  const { rows } = await query(
    `DELETE FROM appointments WHERE tenant_id = $1 AND id = $2 RETURNING ${appointmentColumns}`,
    [tenantId, appointmentId]
  );
  return mapAppointment(rows[0]);
};
