import { ApiError } from '../utils/error.js';
import { findById as findUserById } from '../repositories/user.repository.js';
import {
  createWaitlistEntry,
  listWaitlistEntries,
  getWaitlistEntryById,
  updateWaitlistEntry,
  deleteWaitlistEntry
} from '../repositories/waitlist.repository.js';

const validateRequestWindow = (start, end) => {
  if (start && end && new Date(end) <= new Date(start)) {
    throw new ApiError(400, 'requested_end must be after requested_start');
  }
};

const ensureUserInTenant = async (tenantId, userId, roleName) => {
  if (!userId) {
    return null;
  }
  const user = await findUserById(userId);
  if (!user || user.tenant_id !== tenantId) {
    throw new ApiError(400, `${roleName} must belong to tenant`);
  }
  if (user.status !== 'active') {
    throw new ApiError(400, `${roleName} must be active`);
  }
  return user;
};

export const createEntry = async ({
  tenantId,
  clientUserId,
  providerUserId,
  priority,
  requestedStart,
  requestedEnd,
  autoPromote,
  notes,
  metadata
}) => {
  await ensureUserInTenant(tenantId, clientUserId, 'Client');
  await ensureUserInTenant(tenantId, providerUserId, 'Provider');
  validateRequestWindow(requestedStart, requestedEnd);

  return createWaitlistEntry({
    tenantId,
    clientUserId,
    providerUserId,
    priority,
    requestedStart,
    requestedEnd,
    autoPromote,
    notes,
    metadata
  });
};

export const listEntries = async ({ tenantId, status, providerUserId, priority }) =>
  listWaitlistEntries({ tenantId, status, providerUserId, priority });

export const getEntry = async (tenantId, id) => {
  const entry = await getWaitlistEntryById(tenantId, id);
  if (!entry) {
    throw new ApiError(404, 'Waitlist entry not found');
  }
  return entry;
};

export const updateEntry = async (tenantId, id, updates) => {
  if (updates.requested_start || updates.requested_end) {
    const existing = await getEntry(tenantId, id);
    validateRequestWindow(
      updates.requested_start ?? existing.requested_start,
      updates.requested_end ?? existing.requested_end
    );
  }

  if (updates.client_user_id) {
    await ensureUserInTenant(tenantId, updates.client_user_id, 'Client');
  }
  if (updates.provider_user_id) {
    await ensureUserInTenant(tenantId, updates.provider_user_id, 'Provider');
  }

  const entry = await updateWaitlistEntry(tenantId, id, updates);
  if (!entry) {
    throw new ApiError(404, 'Waitlist entry not found');
  }
  return entry;
};

export const promoteEntry = async (tenantId, id) => {
  const entry = await getEntry(tenantId, id);
  if (entry.status !== 'active') {
    throw new ApiError(400, 'Only active entries can be promoted');
  }
  const updated = await updateWaitlistEntry(tenantId, id, {
    status: 'promoted',
    promoted_at: new Date().toISOString()
  });
  return updated;
};

export const cancelEntry = async (tenantId, id, { reason }) => {
  const entry = await getEntry(tenantId, id);
  if (entry.status === 'cancelled') {
    return entry;
  }
  return updateWaitlistEntry(tenantId, id, {
    status: 'cancelled',
    notes: reason ? `${entry.notes ?? ''}\nCancelled: ${reason}`.trim() : entry.notes
  });
};

export const removeEntry = async (tenantId, id) => {
  const deleted = await deleteWaitlistEntry(tenantId, id);
  if (!deleted) {
    throw new ApiError(404, 'Waitlist entry not found');
  }
  return deleted;
};
