import moment from 'moment-timezone';
import { ApiError } from '../utils/error.js';
import { getCalendarById } from '../repositories/calendar.repository.js';
import {
  createAvailabilitySlot,
  listAvailabilitySlotsByCalendar,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  getAvailabilitySlotById,
  findCalendarsForAvailability,
  findSlotsForCalendars,
  findAppointmentsForCalendars
} from '../repositories/availability.repository.js';
import { cacheDelPattern, cacheGet, cacheSet } from '../config/redis.js';
import { isValidTimezone } from '../utils/timezone.js';

const SLOT_MINUTES = 15;
const CACHE_NAMESPACE = 'availability';
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_AVAILABILITY || '60', 10);

const invalidateAvailabilityCache = async (tenantId) => {
  await cacheDelPattern(`${CACHE_NAMESPACE}:${tenantId}:*`);
};

const ensureCalendarOwnership = async (tenantId, calendarId) => {
  const calendar = await getCalendarById(tenantId, calendarId);
  if (!calendar) {
    throw new ApiError(404, 'Calendar not found');
  }
  return calendar;
};

const slotsOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const validateSlot = (slot) => {
  if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
    throw new ApiError(400, 'dayOfWeek must be between 0 and 6');
  }

  const start = moment(slot.startTime, 'HH:mm:ss', true);
  const end = moment(slot.endTime, 'HH:mm:ss', true);

  if (!start.isValid() || !end.isValid()) {
    throw new ApiError(400, 'startTime and endTime must be valid HH:mm:ss strings');
  }

  if (!end.isAfter(start)) {
    throw new ApiError(400, 'endTime must be after startTime');
  }

  const durationMinutes = moment.duration(end.diff(start)).asMinutes();
  if (durationMinutes < SLOT_MINUTES) {
    throw new ApiError(400, `Availability slot must be at least ${SLOT_MINUTES} minutes`);
  }
};

const ensureNoOverlap = async (calendarId, dayOfWeek, startTime, endTime, ignoreSlotId) => {
  const slots = await listAvailabilitySlotsByCalendar(calendarId);
  const start = moment(startTime, 'HH:mm:ss');
  const end = moment(endTime, 'HH:mm:ss');

  slots
    .filter((slot) => slot.day_of_week === dayOfWeek && slot.id !== ignoreSlotId)
    .forEach((slot) => {
      const slotStart = moment(slot.start_time, 'HH:mm:ss');
      const slotEnd = moment(slot.end_time, 'HH:mm:ss');
      if (slotsOverlap(start, end, slotStart, slotEnd)) {
        throw new ApiError(400, 'Availability slot overlaps with existing slot');
      }
    });
};

export const createSlotForCalendar = async (tenantId, calendarId, slot) => {
  await ensureCalendarOwnership(tenantId, calendarId);
  validateSlot(slot);
  await ensureNoOverlap(calendarId, slot.dayOfWeek, slot.startTime, slot.endTime);
  const created = await createAvailabilitySlot({
    calendarId,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity || 1,
    metadata: slot.metadata || null
  });
  await invalidateAvailabilityCache(tenantId);
  return created;
};

export const listSlotsForCalendar = async (tenantId, calendarId) => {
  await ensureCalendarOwnership(tenantId, calendarId);
  return listAvailabilitySlotsByCalendar(calendarId);
};

export const updateSlotForCalendar = async (tenantId, calendarId, slotId, updates) => {
  await ensureCalendarOwnership(tenantId, calendarId);
  const existing = await getAvailabilitySlotById(slotId);
  if (!existing || existing.calendar_id !== calendarId) {
    throw new ApiError(404, 'Availability slot not found');
  }

  const payload = {
    dayOfWeek: updates.dayOfWeek ?? existing.day_of_week,
    startTime: updates.startTime ?? existing.start_time,
    endTime: updates.endTime ?? existing.end_time,
    capacity: updates.capacity ?? existing.capacity
  };

  validateSlot(payload);
  await ensureNoOverlap(
    calendarId,
    payload.dayOfWeek,
    payload.startTime,
    payload.endTime,
    slotId
  );

  const updated = await updateAvailabilitySlot(slotId, {
    day_of_week: payload.dayOfWeek,
    start_time: payload.startTime,
    end_time: payload.endTime,
    capacity: payload.capacity,
    metadata: updates.metadata ?? existing.metadata
  });

  await invalidateAvailabilityCache(tenantId);
  return updated;
};

export const deleteSlotForCalendar = async (tenantId, calendarId, slotId) => {
  await ensureCalendarOwnership(tenantId, calendarId);
  const slot = await getAvailabilitySlotById(slotId);
  if (!slot || slot.calendar_id !== calendarId) {
    throw new ApiError(404, 'Availability slot not found');
  }
  await deleteAvailabilitySlot(slotId);
  await invalidateAvailabilityCache(tenantId);
};

const groupBy = (items, key) =>
  items.reduce((acc, item) => {
    const mapKey = item[key];
    if (!acc.has(mapKey)) {
      acc.set(mapKey, []);
    }
    acc.get(mapKey).push(item);
    return acc;
  }, new Map());

const formatCacheKey = ({ tenantId, skillIds, startUtc, endUtc, duration, timezone }) => {
  const skillsPart = (skillIds || []).slice().sort().join(',');
  return `${CACHE_NAMESPACE}:${tenantId}:${skillsPart}:${startUtc}:${endUtc}:${duration}:${timezone}`;
};

const countOverlaps = (appointments, startUtc, endUtc) =>
  appointments.filter((appt) => {
    const apptStart = moment(appt.start_time);
    const apptEnd = moment(appt.end_time);
    return apptEnd.isAfter(startUtc) && apptStart.isBefore(endUtc);
  }).length;

export const searchAvailability = async ({
  tenantId,
  skillIds = [],
  start,
  end,
  duration = 30,
  timezone
}) => {
  if (!start || !end) {
    throw new ApiError(400, 'start and end are required');
  }

  if (!timezone) {
    throw new ApiError(400, 'timezone is required');
  }

  if (!isValidTimezone(timezone)) {
    throw new ApiError(400, 'Invalid timezone');
  }

  const searchStart = moment.tz(start, timezone);
  const searchEnd = moment.tz(end, timezone);

  if (!searchStart.isValid() || !searchEnd.isValid()) {
    throw new ApiError(400, 'Invalid start or end datetime');
  }

  if (!searchEnd.isAfter(searchStart)) {
    throw new ApiError(400, 'end must be after start');
  }

  if (duration < SLOT_MINUTES) {
    throw new ApiError(400, `duration must be at least ${SLOT_MINUTES} minutes`);
  }

  const cacheKey = formatCacheKey({
    tenantId,
    skillIds,
    startUtc: searchStart.clone().utc().toISOString(),
    endUtc: searchEnd.clone().utc().toISOString(),
    duration,
    timezone
  });

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return cached;
  }

  const calendars = await findCalendarsForAvailability(tenantId);
  const calendarsMatchingSkills = calendars.filter((calendar) => {
    if (!skillIds.length) {
      return true;
    }
    const calendarSkills = new Set(calendar.skills || []);
    return skillIds.every((skillId) => calendarSkills.has(skillId));
  });

  if (!calendarsMatchingSkills.length) {
    return [];
  }

  const calendarIds = calendarsMatchingSkills.map((calendar) => calendar.id);

  const [slots, appointments] = await Promise.all([
    findSlotsForCalendars(calendarIds),
    findAppointmentsForCalendars(
      calendarIds,
      searchStart.clone().utc().toISOString(),
      searchEnd.clone().utc().toISOString()
    )
  ]);

  const slotsByCalendar = groupBy(slots, 'calendar_id');
  const appointmentsByCalendar = groupBy(appointments, 'calendar_id');

  const availability = [];
  const stepDuration = moment.duration(duration, 'minutes');

  calendarsMatchingSkills.forEach((calendar) => {
    const calendarSlots = slotsByCalendar.get(calendar.id) || [];
    if (!calendarSlots.length) {
      return;
    }

    const calendarAppointments = appointmentsByCalendar.get(calendar.id) || [];
    const calendarTimezone = calendar.timezone;

    const windowStart = searchStart.clone().tz(calendarTimezone);
    const windowEnd = searchEnd.clone().tz(calendarTimezone);

    calendarSlots.forEach((slot) => {
      let dayCursor = windowStart.clone().startOf('day');
      if (dayCursor.isBefore(windowStart)) {
        dayCursor = windowStart.clone().startOf('day');
      }

      while (dayCursor.isSameOrBefore(windowEnd, 'day')) {
        if (dayCursor.day() === slot.day_of_week) {
          const slotStart = moment.tz(
            `${dayCursor.format('YYYY-MM-DD')} ${slot.start_time}`,
            calendarTimezone
          );
          const slotEnd = moment.tz(
            `${dayCursor.format('YYYY-MM-DD')} ${slot.end_time}`,
            calendarTimezone
          );

          let candidateStart = slotStart.clone();

          while (candidateStart.isBefore(slotEnd)) {
            const candidateEnd = candidateStart.clone().add(stepDuration);

            if (!candidateEnd.isAfter(slotEnd)) {
              if (
                candidateStart.isSameOrAfter(windowStart) &&
                candidateEnd.isSameOrBefore(windowEnd)
              ) {
                const candidateStartUtc = candidateStart.clone().utc();
                const candidateEndUtc = candidateEnd.clone().utc();

                const overlappingCount = countOverlaps(
                  calendarAppointments,
                  candidateStartUtc,
                  candidateEndUtc
                );

                if (overlappingCount < (slot.capacity || 1)) {
                  availability.push({
                    calendarId: calendar.id,
                    providerUserId: calendar.provider_user_id,
                    tenantId: calendar.tenant_id,
                    skills: calendar.skills,
                    slotId: slot.id,
                    start: candidateStartUtc.toISOString(),
                    end: candidateEndUtc.toISOString(),
                    timezone: calendarTimezone,
                    availableCapacity: (slot.capacity || 1) - overlappingCount,
                    capacity: slot.capacity || 1
                  });
                }
              }
            } else {
              break;
            }

            candidateStart = candidateStart.add(stepDuration);
          }
        }

        dayCursor.add(1, 'day');
      }
    });
  });

  availability.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  await cacheSet(cacheKey, availability, CACHE_TTL_SECONDS);
  return availability;
};
