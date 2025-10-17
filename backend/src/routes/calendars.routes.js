import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import {
  listCalendars,
  getCalendar,
  createCalendar,
  updateCalendar,
  deleteCalendar
} from '../controllers/calendar.controller.js';
import {
  listCalendarsValidation,
  createCalendarValidation,
  updateCalendarValidation,
  deleteCalendarValidation,
  getCalendarValidation
} from '../validators/calendar.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions(['calendars:read'], { legacyRoles: ['admin', 'provider', 'user'] }),
  listCalendarsValidation,
  listCalendars
);
router.get(
  '/:calendarId',
  requirePermissions(['calendars:read'], { legacyRoles: ['admin', 'provider', 'user'] }),
  getCalendarValidation,
  getCalendar
);
router.post(
  '/',
  requirePermissions(['calendars:create'], { legacyRoles: ['admin'] }),
  createCalendarValidation,
  createCalendar
);
router.put(
  '/:calendarId',
  requirePermissions(['calendars:update'], { legacyRoles: ['admin'] }),
  updateCalendarValidation,
  updateCalendar
);
router.delete(
  '/:calendarId',
  requirePermissions(['calendars:delete'], { legacyRoles: ['admin'] }),
  deleteCalendarValidation,
  deleteCalendar
);

export default router;
