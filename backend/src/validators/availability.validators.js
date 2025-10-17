import { body, param } from 'express-validator';
import { runValidations } from '../utils/validation.js';
import { isValidTimezone } from '../utils/timezone.js';

const timeValidator = (value) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

export const listSlotsValidation = runValidations([
  param('calendarId').isUUID().withMessage('calendarId must be a UUID')
]);

export const createSlotValidation = runValidations([
  param('calendarId').isUUID().withMessage('calendarId must be a UUID'),
  body('dayOfWeek').isInt({ min: 0, max: 6 }),
  body('startTime').custom(timeValidator).withMessage('startTime must be HH:mm or HH:mm:ss'),
  body('endTime').custom(timeValidator).withMessage('endTime must be HH:mm or HH:mm:ss'),
  body('capacity').optional().isInt({ min: 1 })
]);

export const updateSlotValidation = runValidations([
  param('calendarId').isUUID(),
  param('slotId').isUUID(),
  body('dayOfWeek').optional().isInt({ min: 0, max: 6 }),
  body('startTime').optional().custom(timeValidator),
  body('endTime').optional().custom(timeValidator),
  body('capacity').optional().isInt({ min: 1 })
]);

export const deleteSlotValidation = runValidations([
  param('calendarId').isUUID(),
  param('slotId').isUUID()
]);

export const searchAvailabilityValidation = runValidations([
  body('start').isISO8601(),
  body('end').isISO8601(),
  body('duration').optional().isInt({ min: 15 }),
  body('timezone')
    .isString()
    .custom((tz) => isValidTimezone(tz))
    .withMessage('timezone must be a valid IANA identifier'),
  body('skillIds').optional().isArray(),
  body('skillIds.*').optional().isUUID()
]);
