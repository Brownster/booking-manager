import { ApiError } from '../utils/error.js';
import { isValidTimezone } from '../utils/timezone.js';
import { findById as findUserById } from '../repositories/user.repository.js';
import {
  createCalendar,
  getCalendarById,
  listCalendars,
  updateCalendar,
  deleteCalendar
} from '../repositories/calendar.repository.js';
import { findSkillsByIds } from '../repositories/skill.repository.js';

const ensureProviderBelongsToTenant = async (tenantId, providerUserId) => {
  const user = await findUserById(providerUserId);
  if (!user || user.tenant_id !== tenantId) {
    throw new ApiError(400, 'Provider must belong to tenant');
  }
  if (user.status !== 'active') {
    throw new ApiError(400, 'Provider user must be active');
  }
  return user;
};

const ensureSkillsBelongToTenant = async (tenantId, skillIds = []) => {
  if (!skillIds.length) {
    return;
  }
  const skills = await findSkillsByIds(tenantId, skillIds);
  if (skills.length !== skillIds.length) {
    throw new ApiError(400, 'One or more skills do not belong to tenant');
  }
};

export const createCalendarForTenant = async ({
  tenantId,
  providerUserId,
  serviceType,
  timezone,
  isActive,
  color,
  skillIds
}) => {
  if (!isValidTimezone(timezone)) {
    throw new ApiError(400, 'Invalid timezone');
  }

  await ensureProviderBelongsToTenant(tenantId, providerUserId);
  await ensureSkillsBelongToTenant(tenantId, skillIds);

  return createCalendar({
    tenantId,
    providerUserId,
    serviceType,
    timezone,
    isActive,
    color,
    skillIds
  });
};

export const listCalendarsForTenant = (tenantId, filters) => listCalendars(tenantId, filters);

export const updateCalendarForTenant = async (tenantId, calendarId, payload) => {
  if (payload.timezone && !isValidTimezone(payload.timezone)) {
    throw new ApiError(400, 'Invalid timezone');
  }

  if (payload.providerUserId) {
    await ensureProviderBelongsToTenant(tenantId, payload.providerUserId);
  }

  if (payload.skillIds) {
    await ensureSkillsBelongToTenant(tenantId, payload.skillIds);
  }

  const updatePayload = {
    ...(payload.serviceType && { service_type: payload.serviceType }),
    ...(payload.timezone && { timezone: payload.timezone }),
    ...(typeof payload.isActive === 'boolean' && { is_active: payload.isActive }),
    ...(payload.color && { color: payload.color }),
    ...(payload.providerUserId && { provider_user_id: payload.providerUserId })
  };

  const updated = await updateCalendar(tenantId, calendarId, {
    ...updatePayload,
    ...(payload.skillIds && { skillIds: payload.skillIds })
  });
  if (!updated) {
    throw new ApiError(404, 'Calendar not found');
  }
  return updated;
};

export const removeCalendarForTenant = async (tenantId, calendarId) => {
  const deleted = await deleteCalendar(tenantId, calendarId);
  if (!deleted) {
    throw new ApiError(404, 'Calendar not found');
  }
  return deleted;
};

export const getCalendarForTenant = async (tenantId, calendarId) => {
  const calendar = await getCalendarById(tenantId, calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendar not found');
  }
  return calendar;
};
