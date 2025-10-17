import { query } from '../config/database.js';

const waitlistFields = `
  id,
  tenant_id,
  client_user_id,
  provider_user_id,
  priority,
  status,
  requested_start,
  requested_end,
  auto_promote,
  notes,
  metadata,
  promoted_at,
  created_at,
  updated_at
`;

const mapEntry = (row) =>
  row && {
    id: row.id,
    tenant_id: row.tenant_id,
    client_user_id: row.client_user_id,
    provider_user_id: row.provider_user_id,
    priority: row.priority,
    status: row.status,
    requested_start: row.requested_start,
    requested_end: row.requested_end,
    auto_promote: row.auto_promote,
    notes: row.notes,
    metadata: row.metadata,
    promoted_at: row.promoted_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

export const createWaitlistEntry = async ({
  tenantId,
  clientUserId,
  providerUserId,
  priority,
  status = 'active',
  requestedStart,
  requestedEnd,
  autoPromote = false,
  notes,
  metadata
}) => {
  const { rows } = await query(
    `
      INSERT INTO waitlist_entries (
        tenant_id,
        client_user_id,
        provider_user_id,
        priority,
        status,
        requested_start,
        requested_end,
        auto_promote,
        notes,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${waitlistFields}
    `,
    [
      tenantId,
      clientUserId,
      providerUserId || null,
      priority || 'medium',
      status,
      requestedStart || null,
      requestedEnd || null,
      autoPromote,
      notes || null,
      metadata || null
    ]
  );

  return mapEntry(rows[0]);
};

export const listWaitlistEntries = async ({ tenantId, status, providerUserId, priority }) => {
  const conditions = ['tenant_id = $1'];
  const values = [tenantId];

  if (status) {
    conditions.push(`status = $${conditions.length + 1}`);
    values.push(status);
  }

  if (providerUserId) {
    conditions.push(`provider_user_id = $${conditions.length + 1}`);
    values.push(providerUserId);
  }

  if (priority) {
    conditions.push(`priority = $${conditions.length + 1}`);
    values.push(priority);
  }

  const { rows } = await query(
    `
      SELECT ${waitlistFields}
      FROM waitlist_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at ASC
    `,
    values
  );

  return rows.map(mapEntry);
};

export const getWaitlistEntryById = async (tenantId, id) => {
  const { rows } = await query(
    `SELECT ${waitlistFields} FROM waitlist_entries WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, id]
  );
  return mapEntry(rows[0]);
};

export const updateWaitlistEntry = async (tenantId, id, updates) => {
  const columnMap = {
    clientUserId: 'client_user_id',
    providerUserId: 'provider_user_id',
    requestedStart: 'requested_start',
    requestedEnd: 'requested_end',
    autoPromote: 'auto_promote',
    promotedAt: 'promoted_at'
  };

  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(updates).forEach(([key, value]) => {
    const column = columnMap[key] || key;
    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  });

  if (!fields.length) {
    return getWaitlistEntryById(tenantId, id);
  }

  values.push(tenantId, id);

  const { rows } = await query(
    `
      UPDATE waitlist_entries
      SET ${fields.join(', ')}
      WHERE tenant_id = $${fields.length + 1}
        AND id = $${fields.length + 2}
      RETURNING ${waitlistFields}
    `,
    values
  );

  return mapEntry(rows[0]);
};

export const deleteWaitlistEntry = async (tenantId, id) => {
  const { rows } = await query(
    `DELETE FROM waitlist_entries WHERE tenant_id = $1 AND id = $2 RETURNING ${waitlistFields}`,
    [tenantId, id]
  );
  return mapEntry(rows[0]);
};
