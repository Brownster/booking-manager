import moment from 'moment-timezone';
import { ApiError } from '../utils/error.js';
import { getCalendarById } from '../repositories/calendar.repository.js';
import { findById as findUserById } from '../repositories/user.repository.js';
import {
  createAppointment,
  getAppointmentById,
  listAppointmentsForCalendar,
  findConflictingAppointments,
  updateAppointment,
  deleteAppointment
} from '../repositories/appointment.repository.js';
import { cacheDelPattern } from '../config/redis.js';

const MIN_APPOINTMENT_MINUTES = 15;
const invalidateAvailabilityCache = async (tenantId) => {
  await cacheDelPattern(`availability:${tenantId}:*`);
};

const validateTimes = (startTime, endTime) => {
  const start = moment(startTime);
  const end = moment(endTime);

  if (!start.isValid() || !end.isValid()) {
    throw new ApiError(400, 'Invalid appointment time');
  }

  if (!end.isAfter(start)) {
    throw new ApiError(400, 'Appointment end must be after start');
  }

  const duration = moment.duration(end.diff(start)).asMinutes();
  if (duration < MIN_APPOINTMENT_MINUTES) {
    throw new ApiError(400, `Appointments must be at least ${MIN_APPOINTMENT_MINUTES} minutes`);
  }

  return { start, end };
};

export const createAppointmentForTenant = async ({
  tenantId,
  calendarId,
  clientUserId,
  startTime,
  endTime,
  requiredSkills,
  notes,
  metadata
}) => {
  const calendar = await getCalendarById(tenantId, calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendar not found');
  }

  const client = await findUserById(clientUserId);
  if (!client || client.tenant_id !== tenantId) {
    throw new ApiError(400, 'Client user must belong to tenant');
  }
  if (client.status !== 'active') {
    throw new ApiError(400, 'Client user must be active');
  }

  const { start, end } = validateTimes(startTime, endTime);

  const conflicts = await findConflictingAppointments(calendarId, start.toISOString(), end.toISOString());
  if (conflicts.length) {
    throw new ApiError(409, 'Appointment conflicts with existing booking');
  }

  if (requiredSkills?.length) {
    const calendarSkills = new Set(calendar.skills || []);
    const missing = requiredSkills.filter((skillId) => !calendarSkills.has(skillId));
    if (missing.length) {
      throw new ApiError(400, 'Calendar does not support required skills');
    }
  }

  const created = await createAppointment({
    tenantId,
    calendarId,
    clientUserId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: 'pending',
    requiredSkills,
    notes,
    metadata
  });
  await invalidateAvailabilityCache(tenantId);
  return created;
};

export const listAppointments = async ({ tenantId, calendarId, start, end }) => {
  const calendar = await getCalendarById(tenantId, calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendar not found');
  }
  return listAppointmentsForCalendar(tenantId, calendarId, { start, end });
};

export const updateAppointmentForTenant = async ({
  tenantId,
  appointmentId,
  startTime,
  endTime,
  status,
  notes,
  metadata
}) => {
  const appointment = await getAppointmentById(tenantId, appointmentId);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  let payload = {};

  if (startTime || endTime) {
    const { start, end } = validateTimes(startTime || appointment.start_time, endTime || appointment.end_time);
    const conflicts = await findConflictingAppointments(
      appointment.calendar_id,
      start.toISOString(),
      end.toISOString(),
      appointment.id
    );
    if (conflicts.length) {
      throw new ApiError(409, 'Appointment conflicts with existing booking');
    }
    payload = {
      ...payload,
      start_time: start.toISOString(),
      end_time: end.toISOString()
    };
  }

  if (status) {
    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid appointment status');
    }
    payload.status = status;
  }

  if (notes !== undefined) {
    payload.notes = notes;
  }

  if (metadata !== undefined) {
    payload.metadata = metadata;
  }

  const updated = await updateAppointment(tenantId, appointmentId, payload);
  await invalidateAvailabilityCache(tenantId);
  return updated;
};

export const cancelAppointmentForTenant = async (tenantId, appointmentId) => {
  const appointment = await getAppointmentById(tenantId, appointmentId);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  const cancelled = await updateAppointment(tenantId, appointmentId, { status: 'cancelled' });
  await invalidateAvailabilityCache(tenantId);
  return cancelled;
};

export const deleteAppointmentForTenant = async (tenantId, appointmentId) => {
  const deleted = await deleteAppointment(tenantId, appointmentId);
  if (!deleted) {
    throw new ApiError(404, 'Appointment not found');
  }
  await invalidateAvailabilityCache(tenantId);
  return deleted;
};
