import { body, param, query } from 'express-validator';
import { runValidations } from '../utils/validation.js';
import { isValidTimezone } from '../utils/timezone.js';

const timezoneValidator = body('timezone')
  .isString()
  .custom((tz) => isValidTimezone(tz))
  .withMessage('Invalid timezone');

export const listCalendarsValidation = runValidations([
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('providerUserId').optional().isUUID()
]);

export const createCalendarValidation = runValidations([
  body('providerUserId').isUUID().withMessage('providerUserId must be a UUID'),
  body('serviceType').isString().isLength({ min: 2, max: 120 }),
  timezoneValidator,
  body('isActive').optional().isBoolean(),
  body('skillIds').optional().isArray(),
  body('skillIds.*').optional().isUUID()
]);

export const updateCalendarValidation = runValidations([
  param('calendarId').isUUID(),
  body('providerUserId').optional().isUUID(),
  body('serviceType').optional().isString().isLength({ min: 2, max: 120 }),
  body('timezone').optional().custom((tz) => isValidTimezone(tz)).withMessage('Invalid timezone'),
  body('isActive').optional().isBoolean(),
  body('skillIds').optional().isArray(),
  body('skillIds.*').optional().isUUID()
]);

export const deleteCalendarValidation = runValidations([
  param('calendarId').isUUID()
]);

export const getCalendarValidation = deleteCalendarValidation;
