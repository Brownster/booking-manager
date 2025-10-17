import { query } from '../config/database.js';

const appointmentColumns = `
  id,
  tenant_id,
  name,
  description,
  start_time,
  end_time,
  duration_minutes,
  max_participants,
  status,
  created_by,
  metadata,
  created_at,
  updated_at
`;

const providerColumns = `
  id,
  group_appointment_id,
  provider_user_id,
  calendar_id,
  status,
  confirmed_at,
  declined_at,
  created_at,
  updated_at
`;

const participantColumns = `
  id,
  group_appointment_id,
  participant_user_id,
  status,
  invited_at,
  confirmed_at,
  declined_at,
  metadata,
  created_at,
  updated_at
`;

const run = (client, text, params) => (client ? client.query(text, params) : query(text, params));

const mapAppointment = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    description: row.description,
    start_time: row.start_time,
    end_time: row.end_time,
    duration_minutes: row.duration_minutes,
    max_participants: row.max_participants,
    status: row.status,
    created_by: row.created_by,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    providers: row.providers ?? [],
    participants: row.participants ?? []
  };

export const insertGroupAppointment = async (data, client) => {
  const params = [
    data.tenantId,
    data.name,
    data.description ?? null,
    data.startTime,
    data.endTime,
    data.durationMinutes,
    data.maxParticipants ?? 1,
    data.status ?? 'scheduled',
    data.createdBy,
    data.metadata ?? null
  ];

  const { rows } = await run(
    client,
    `
      INSERT INTO group_appointments (
        tenant_id,
        name,
        description,
        start_time,
        end_time,
        duration_minutes,
        max_participants,
        status,
        created_by,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${appointmentColumns}
    `,
    params
  );

  return mapAppointment(rows[0]);
};

export const insertGroupProviders = async ({ providers, groupAppointmentId }, client) => {
  if (!providers?.length) {
    return [];
  }
  const values = [];
  const params = [];
  providers.forEach((provider, index) => {
    const offset = index * 3;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
    params.push(groupAppointmentId, provider.userId, provider.calendarId ?? null);
  });

  const { rows } = await run(
    client,
    `
      INSERT INTO group_appointment_providers (
        group_appointment_id,
        provider_user_id,
        calendar_id
      )
      VALUES ${values.join(', ')}
      RETURNING ${providerColumns}
    `,
    params
  );

  return rows;
};

export const insertGroupParticipants = async ({ participants, groupAppointmentId }, client) => {
  if (!participants?.length) {
    return [];
  }
  const values = [];
  const params = [];
  participants.forEach((participant, index) => {
    const offset = index * 3;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
    params.push(groupAppointmentId, participant.userId, participant.metadata ?? null);
  });

  const { rows } = await run(
    client,
    `
      INSERT INTO group_appointment_participants (
        group_appointment_id,
        participant_user_id,
        metadata
      )
      VALUES ${values.join(', ')}
      RETURNING ${participantColumns}
    `,
    params
  );

  return rows;
};

export const findGroupAppointmentById = async (tenantId, id) => {
  const { rows } = await query(
    `
      SELECT
        ${appointmentColumns},
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', gap.id,
              'provider_user_id', gap.provider_user_id,
              'calendar_id', gap.calendar_id,
              'status', gap.status,
              'confirmed_at', gap.confirmed_at,
              'declined_at', gap.declined_at,
              'created_at', gap.created_at,
              'updated_at', gap.updated_at
            ) ORDER BY gap.created_at)
            FROM group_appointment_providers gap
            WHERE gap.group_appointment_id = ga.id
          ),
          '[]'
        ) AS providers,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', gapart.id,
              'participant_user_id', gapart.participant_user_id,
              'status', gapart.status,
              'invited_at', gapart.invited_at,
              'confirmed_at', gapart.confirmed_at,
              'declined_at', gapart.declined_at,
              'metadata', gapart.metadata,
              'created_at', gapart.created_at,
              'updated_at', gapart.updated_at
            ) ORDER BY gapart.invited_at)
            FROM group_appointment_participants gapart
            WHERE gapart.group_appointment_id = ga.id
          ),
          '[]'
        ) AS participants
      FROM group_appointments ga
      WHERE ga.tenant_id = $1 AND ga.id = $2
      LIMIT 1
    `,
    [tenantId, id]
  );
  return mapAppointment(rows[0]);
};

export const listGroupAppointments = async ({ tenantId, status, providerUserId, participantUserId }) => {
  const conditions = ['ga.tenant_id = $1'];
  const params = [tenantId];

  if (status) {
    params.push(status);
    conditions.push(`ga.status = $${params.length}`);
  }

  if (providerUserId) {
    params.push(providerUserId);
    conditions.push(`EXISTS (
      SELECT 1 FROM group_appointment_providers gap
      WHERE gap.group_appointment_id = ga.id AND gap.provider_user_id = $${params.length}
    )`);
  }

  if (participantUserId) {
    params.push(participantUserId);
    conditions.push(`EXISTS (
      SELECT 1 FROM group_appointment_participants gapart
      WHERE gapart.group_appointment_id = ga.id AND gapart.participant_user_id = $${params.length}
    )`);
  }

  const { rows } = await query(
    `
      SELECT
        ${appointmentColumns},
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', gap.id,
              'provider_user_id', gap.provider_user_id,
              'calendar_id', gap.calendar_id,
              'status', gap.status,
              'confirmed_at', gap.confirmed_at,
              'declined_at', gap.declined_at
            ))
            FROM group_appointment_providers gap
            WHERE gap.group_appointment_id = ga.id
          ),
          '[]'
        ) AS providers,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', gapart.id,
              'participant_user_id', gapart.participant_user_id,
              'status', gapart.status,
              'confirmed_at', gapart.confirmed_at,
              'declined_at', gapart.declined_at
            ))
            FROM group_appointment_participants gapart
            WHERE gapart.group_appointment_id = ga.id
          ),
          '[]'
        ) AS participants
      FROM group_appointments ga
      WHERE ${conditions.join(' AND ')}
      ORDER BY ga.start_time ASC
    `,
    params
  );

  return rows.map(mapAppointment);
};

export const updateGroupAppointment = async (tenantId, id, updates, client) => {
  const allowed = [
    'name',
    'description',
    'start_time',
    'end_time',
    'duration_minutes',
    'max_participants',
    'status',
    'metadata'
  ];

  const entries = Object.entries(updates).filter(([key]) => allowed.includes(key));
  if (!entries.length) {
    return findGroupAppointmentById(tenantId, id);
  }

  const sets = [];
  const params = [];
  entries.forEach(([key, value], index) => {
    sets.push(`${key} = $${index + 1}`);
    params.push(value);
  });

  params.push(tenantId, id);

  const { rows } = await run(
    client,
    `
      UPDATE group_appointments
      SET ${sets.join(', ')}
      WHERE tenant_id = $${sets.length + 1}
        AND id = $${sets.length + 2}
      RETURNING ${appointmentColumns}
    `,
    params
  );

  return mapAppointment(rows[0]);
};

export const updateProviderStatus = async ({ groupAppointmentId, providerUserId, status }, client) => {
  const { rows } = await run(
    client,
    `
      UPDATE group_appointment_providers
      SET status = $1,
          confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END,
          declined_at = CASE WHEN $1 = 'declined' THEN NOW() ELSE declined_at END,
          updated_at = NOW()
      WHERE group_appointment_id = $2
        AND provider_user_id = $3
      RETURNING ${providerColumns}
    `,
    [status, groupAppointmentId, providerUserId]
  );
  return rows[0] ?? null;
};

export const updateParticipantStatus = async (
  { groupAppointmentId, participantUserId, status, metadata },
  client
) => {
  const { rows } = await run(
    client,
    `
      UPDATE group_appointment_participants
      SET status = $1,
          confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END,
          declined_at = CASE WHEN $1 = 'declined' THEN NOW() ELSE declined_at END,
          metadata = COALESCE($4, metadata),
          updated_at = NOW()
      WHERE group_appointment_id = $2
        AND participant_user_id = $3
      RETURNING ${participantColumns}
    `,
    [status, groupAppointmentId, participantUserId, metadata ?? null]
  );
  return rows[0] ?? null;
};

export const deleteGroupAppointment = async (tenantId, id, client) => {
  const { rows } = await run(
    client,
    `DELETE FROM group_appointments WHERE tenant_id = $1 AND id = $2 RETURNING ${appointmentColumns}`,
    [tenantId, id]
  );
  return mapAppointment(rows[0]);
};
