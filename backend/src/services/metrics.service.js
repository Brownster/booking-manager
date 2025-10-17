import { query } from '../config/database.js';

const parseDateInput = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  // Return null for invalid dates so we do not break queries downstream.
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDateRangeClause = (column, params, start, end) => {
  let clause = '';
  if (start) {
    params.push(start);
    clause += ` AND ${column} >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    clause += ` AND ${column} <= $${params.length}`;
  }
  return clause;
};

const intFromRow = (row, key) => Number.parseInt(row?.[key] ?? 0, 10) || 0;

export const getDashboardMetrics = async ({
  tenantId,
  rangeStart,
  rangeEnd
}) => {
  const start = parseDateInput(rangeStart);
  const end = parseDateInput(rangeEnd);

  const appointmentParams = [tenantId];
  const appointmentClause = buildDateRangeClause('start_time', appointmentParams, start, end);
  const waitlistParams = [tenantId];
  const waitlistClause = buildDateRangeClause('created_at', waitlistParams, start, end);

  const [appointmentResult, waitlistResult, calendarResult] = await Promise.all([
    query(
      `
        SELECT
          COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS total,
          COUNT(*) FILTER (
            WHERE status IN ('pending', 'confirmed') AND start_time >= NOW()
          )::int AS upcoming,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
          COUNT(*) FILTER (
            WHERE status IN ('confirmed', 'completed')
          )::int AS confirmed
        FROM appointments
        WHERE tenant_id = $1
        ${appointmentClause}
      `,
      appointmentParams
    ),
    query(
      `
        SELECT
          COUNT(*) FILTER (WHERE status = 'active')::int AS active,
          COUNT(*) FILTER (WHERE status = 'promoted')::int AS promoted,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
        FROM waitlist_entries
        WHERE tenant_id = $1
        ${waitlistClause}
      `,
      waitlistParams
    ),
    query(
      `
        SELECT
          COUNT(*) FILTER (WHERE is_active)::int AS active_calendars,
          COUNT(*)::int AS total_calendars
        FROM calendars
        WHERE tenant_id = $1
      `,
      [tenantId]
    )
  ]);

  const appointmentRow = appointmentResult.rows?.[0] ?? {};
  const waitlistRow = waitlistResult.rows?.[0] ?? {};
  const calendarRow = calendarResult.rows?.[0] ?? {};

  const totalAppointments = intFromRow(appointmentRow, 'total');
  const confirmedAppointments = intFromRow(appointmentRow, 'confirmed');
  const totalCalendars = intFromRow(calendarRow, 'total_calendars');
  const pendingAppointments = intFromRow(appointmentRow, 'pending');
  const completedAppointments = intFromRow(appointmentRow, 'completed');
  const cancelledAppointments = Math.max(
    0,
    totalAppointments - confirmedAppointments - pendingAppointments - completedAppointments
  );

  const utilizationPercentage =
    totalAppointments > 0
      ? Math.round((confirmedAppointments / totalAppointments) * 100)
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    range: {
      start: start?.toISOString() ?? null,
      end: end?.toISOString() ?? null
    },
    appointments: {
      total: totalAppointments,
      upcoming: intFromRow(appointmentRow, 'upcoming'),
      completed: completedAppointments,
      pending: pendingAppointments,
      confirmed: confirmedAppointments,
      cancelled: cancelledAppointments
    },
    waitlist: {
      active: intFromRow(waitlistRow, 'active'),
      promoted: intFromRow(waitlistRow, 'promoted'),
      cancelled: intFromRow(waitlistRow, 'cancelled')
    },
    utilization: {
      percentage: Math.max(0, Math.min(100, utilizationPercentage)),
      activeCalendars: intFromRow(calendarRow, 'active_calendars'),
      totalCalendars,
      confirmedAppointments
    }
  };
};
