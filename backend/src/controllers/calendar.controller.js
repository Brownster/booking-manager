import {
  createCalendarForTenant,
  listCalendarsForTenant,
  updateCalendarForTenant,
  removeCalendarForTenant,
  getCalendarForTenant
} from '../services/calendar.service.js';

export const listCalendars = async (req, res, next) => {
  try {
    const { isActive, providerUserId } = req.query;
    const calendars = await listCalendarsForTenant(req.user.tenantId, {
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      providerUserId
    });
    res.status(200).json({ calendars });
  } catch (error) {
    next(error);
  }
};

export const getCalendar = async (req, res, next) => {
  try {
    const calendar = await getCalendarForTenant(req.user.tenantId, req.params.calendarId);
    res.status(200).json({ calendar });
  } catch (error) {
    next(error);
  }
};

export const createCalendar = async (req, res, next) => {
  try {
    const {
      providerUserId,
      serviceType,
      timezone,
      isActive = true,
      color,
      skillIds = []
    } = req.body;

    const calendar = await createCalendarForTenant({
      tenantId: req.user.tenantId,
      providerUserId,
      serviceType,
      timezone,
      isActive,
      color,
      skillIds
    });

    res.status(201).json({ calendar });
  } catch (error) {
    next(error);
  }
};

export const updateCalendar = async (req, res, next) => {
  try {
    const { calendarId } = req.params;
    const {
      serviceType,
      timezone,
      isActive,
      color,
      providerUserId,
      skillIds
    } = req.body;

    const updates = {
      ...(serviceType && { serviceType }),
      ...(timezone && { timezone }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(color && { color }),
      ...(providerUserId && { providerUserId }),
      ...(Array.isArray(skillIds) && { skillIds })
    };

    const calendar = await updateCalendarForTenant(req.user.tenantId, calendarId, updates);
    res.status(200).json({ calendar });
  } catch (error) {
    next(error);
  }
};

export const deleteCalendar = async (req, res, next) => {
  try {
    await removeCalendarForTenant(req.user.tenantId, req.params.calendarId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
