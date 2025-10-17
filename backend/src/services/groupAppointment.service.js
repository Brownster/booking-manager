import { transaction } from '../config/database.js';
import { ApiError } from '../utils/error.js';
import { findById as findUserById } from '../repositories/user.repository.js';
import { getCalendarById } from '../repositories/calendar.repository.js';
import { findConflictingAppointments } from '../repositories/appointment.repository.js';
import {
  insertGroupAppointment,
  insertGroupParticipants,
  insertGroupProviders,
  findGroupAppointmentById,
  listGroupAppointments,
  updateGroupAppointment,
  deleteGroupAppointment,
  updateProviderStatus,
  updateParticipantStatus
} from '../repositories/groupAppointment.repository.js';

const PROVIDER_STATUSES = new Set(['pending', 'confirmed', 'declined']);
const PARTICIPANT_STATUSES = new Set(['invited', 'confirmed', 'declined', 'cancelled']);
const APPOINTMENT_STATUSES = new Set(['scheduled', 'confirmed', 'completed', 'cancelled']);

const assertDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ApiError(400, 'start_time and end_time must be valid ISO timestamps');
  }
  if (endDate <= startDate) {
    throw new ApiError(400, 'end_time must be after start_time');
  }
};

const ensureUserActiveInTenant = async (tenantId, userId, roleLabel) => {
  const user = await findUserById(userId);
  if (!user || user.tenant_id !== tenantId) {
    throw new ApiError(400, `${roleLabel} must belong to tenant`);
  }
  if (user.status !== 'active') {
    throw new ApiError(400, `${roleLabel} must be active`);
  }
  return user;
};

const ensureCalendarForProvider = async (tenantId, calendarId, providerUserId) => {
  if (!calendarId) {
    return null;
  }
  const calendar = await getCalendarById(tenantId, calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendar not found');
  }
  if (calendar.provider_user_id !== providerUserId) {
    throw new ApiError(400, 'Calendar must belong to provider');
  }
  if (!calendar.is_active) {
    throw new ApiError(400, 'Calendar must be active');
  }
  return calendar;
};

const ensureNoCalendarConflicts = async ({ calendarId, startTime, endTime, ignoreAppointmentId }) => {
  if (!calendarId) {
    return;
  }
  const conflicts = await findConflictingAppointments(calendarId, startTime, endTime, ignoreAppointmentId);
  if (conflicts.length) {
    throw new ApiError(409, 'Calendar is not available for the selected time window', {
      conflicts
    });
  }
};

const normalizeProviderInput = (providers = []) => {
  const seen = new Set();
  return providers
    .filter((provider) => provider?.userId)
    .map((provider) => ({
      userId: provider.userId,
      calendarId: provider.calendarId ?? null
    }))
    .filter((provider) => {
      if (seen.has(provider.userId)) {
        return false;
      }
      seen.add(provider.userId);
      return true;
    });
};

const normalizeParticipantInput = (participants = []) => {
  const seen = new Set();
  return participants
    .filter((participant) => participant?.userId)
    .map((participant) => ({ userId: participant.userId, metadata: participant.metadata ?? null }))
    .filter((participant) => {
      if (seen.has(participant.userId)) {
        return false;
      }
      seen.add(participant.userId);
      return true;
    });
};

export const createGroupAppointment = async ({
  tenantId,
  name,
  description,
  startTime,
  endTime,
  durationMinutes,
  maxParticipants,
  providers,
  participants,
  createdBy,
  metadata
}) => {
  if (!providers?.length) {
    throw new ApiError(400, 'At least one provider is required');
  }

  assertDateRange(startTime, endTime);

  const providerRecords = normalizeProviderInput(providers);
  const participantRecords = normalizeParticipantInput(participants);

  if (!providerRecords.length) {
    throw new ApiError(400, 'At least one provider is required');
  }

  const duration = durationMinutes ?? Math.max(15, Math.round((new Date(endTime) - new Date(startTime)) / 60000));
  const allowedMaxParticipants = maxParticipants ?? Math.max(1, participantRecords.length);
  if (allowedMaxParticipants < participantRecords.length) {
    throw new ApiError(400, 'max_participants cannot be less than participant count');
  }

  await ensureUserActiveInTenant(tenantId, createdBy, 'Creator');

  await Promise.all(
    providerRecords.map(async (provider) => {
      await ensureUserActiveInTenant(tenantId, provider.userId, 'Provider');
      await ensureCalendarForProvider(tenantId, provider.calendarId, provider.userId);
      await ensureNoCalendarConflicts({
        calendarId: provider.calendarId,
        startTime,
        endTime
      });
    })
  );

  await Promise.all(
    participantRecords.map(async (participant) => {
      await ensureUserActiveInTenant(tenantId, participant.userId, 'Participant');
    })
  );

  const appointment = await transaction(async (client) => {
    const createdAppointment = await insertGroupAppointment(
      {
        tenantId,
        name,
        description,
        startTime,
        endTime,
        durationMinutes: duration,
        maxParticipants: allowedMaxParticipants,
        status: 'scheduled',
        createdBy,
        metadata
      },
      client
    );

    await insertGroupProviders(
      {
        groupAppointmentId: createdAppointment.id,
        providers: providerRecords
      },
      client
    );

    if (participantRecords.length) {
      await insertGroupParticipants(
        {
          groupAppointmentId: createdAppointment.id,
          participants: participantRecords
        },
        client
      );
    }

    return createdAppointment;
  });

  return findGroupAppointmentById(tenantId, appointment.id);
};

export const listGroupAppointmentSummaries = async ({
  tenantId,
  status,
  providerUserId,
  participantUserId
}) =>
  listGroupAppointments({
    tenantId,
    status,
    providerUserId,
    participantUserId
  });

export const getGroupAppointment = async (tenantId, id) => {
  const appointment = await findGroupAppointmentById(tenantId, id);
  if (!appointment) {
    throw new ApiError(404, 'Group appointment not found');
  }
  return appointment;
};

export const updateGroupAppointmentDetails = async (tenantId, id, updates) => {
  if (updates.start_time || updates.end_time) {
    const existing = await getGroupAppointment(tenantId, id);
    const nextStart = updates.start_time ?? existing.start_time;
    const nextEnd = updates.end_time ?? existing.end_time;
    assertDateRange(nextStart, nextEnd);
    await Promise.all(
      (existing.providers ?? []).map((provider) =>
        ensureNoCalendarConflicts({
          calendarId: provider.calendar_id,
          startTime: nextStart,
          endTime: nextEnd,
          ignoreAppointmentId: id
        })
      )
    );
  }

  if (updates.status && !APPOINTMENT_STATUSES.has(updates.status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  if (updates.max_participants !== undefined && updates.max_participants <= 0) {
    throw new ApiError(400, 'max_participants must be greater than 0');
  }

  const updated = await updateGroupAppointment(tenantId, id, updates);
  if (!updated) {
    throw new ApiError(404, 'Group appointment not found');
  }

  return findGroupAppointmentById(tenantId, id);
};

export const cancelGroupAppointment = async (tenantId, id) => {
  const appointment = await getGroupAppointment(tenantId, id);
  if (appointment.status === 'cancelled') {
    return appointment;
  }
  const cancelled = await updateGroupAppointment(tenantId, id, { status: 'cancelled' });
  return findGroupAppointmentById(tenantId, cancelled.id);
};

export const respondAsProvider = async ({ tenantId, appointmentId, providerUserId, status }) => {
  if (!PROVIDER_STATUSES.has(status)) {
    throw new ApiError(400, 'Invalid provider status');
  }
  await ensureUserActiveInTenant(tenantId, providerUserId, 'Provider');
  await getGroupAppointment(tenantId, appointmentId);
  const result = await updateProviderStatus({ groupAppointmentId: appointmentId, providerUserId, status });
  if (!result) {
    throw new ApiError(404, 'Provider not part of group appointment');
  }
  return findGroupAppointmentById(tenantId, appointmentId);
};

export const respondAsParticipant = async ({
  tenantId,
  appointmentId,
  participantUserId,
  status,
  metadata
}) => {
  if (!PARTICIPANT_STATUSES.has(status)) {
    throw new ApiError(400, 'Invalid participant status');
  }
  await ensureUserActiveInTenant(tenantId, participantUserId, 'Participant');
  await getGroupAppointment(tenantId, appointmentId);
  const result = await updateParticipantStatus(
    { groupAppointmentId: appointmentId, participantUserId, status, metadata },
    null
  );
  if (!result) {
    throw new ApiError(404, 'Participant not part of group appointment');
  }
  return findGroupAppointmentById(tenantId, appointmentId);
};

export const deleteGroupAppointmentRecord = async (tenantId, id) => {
  const deleted = await deleteGroupAppointment(tenantId, id);
  if (!deleted) {
    throw new ApiError(404, 'Group appointment not found');
  }
  return deleted;
};
