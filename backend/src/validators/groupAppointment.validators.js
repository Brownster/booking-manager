import { body, param, query } from 'express-validator';
import { runValidations } from '../utils/validation.js';

const uuidMessage = 'must be a valid UUID';

const providerSchema = body('providers')
  .isArray({ min: 1 })
  .withMessage('providers must be a non-empty array');

const participantSchema = body('participants')
  .optional()
  .isArray()
  .withMessage('participants must be an array');

export const listGroupAppointmentValidation = runValidations([
  query('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled']),
  query('providerUserId').optional().isUUID().withMessage(uuidMessage),
  query('participantUserId').optional().isUUID().withMessage(uuidMessage)
]);

export const createGroupAppointmentValidation = runValidations([
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
  body('duration_minutes').optional().isInt({ min: 1 }),
  body('max_participants').optional().isInt({ min: 1 }),
  providerSchema,
  body('providers.*.userId').isUUID().withMessage(uuidMessage),
  body('providers.*.calendarId').optional().isUUID().withMessage(uuidMessage),
  participantSchema,
  body('participants.*.userId').isUUID().withMessage(uuidMessage),
  body('participants.*.metadata').optional().isObject(),
  body('metadata').optional().isObject()
]);

export const groupAppointmentIdParamValidation = runValidations([
  param('groupAppointmentId').isUUID().withMessage(uuidMessage)
]);

export const updateGroupAppointmentValidation = runValidations([
  param('groupAppointmentId').isUUID().withMessage(uuidMessage),
  body('name').optional().isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('start_time').optional().isISO8601(),
  body('end_time').optional().isISO8601(),
  body('duration_minutes').optional().isInt({ min: 1 }),
  body('max_participants').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled']),
  body('metadata').optional().isObject()
]);

export const providerResponseValidation = runValidations([
  param('groupAppointmentId').isUUID().withMessage(uuidMessage),
  param('providerUserId').isUUID().withMessage(uuidMessage),
  body('status').isIn(['pending', 'confirmed', 'declined'])
]);

export const participantResponseValidation = runValidations([
  param('groupAppointmentId').isUUID().withMessage(uuidMessage),
  param('participantUserId').isUUID().withMessage(uuidMessage),
  body('status').isIn(['invited', 'confirmed', 'declined', 'cancelled']),
  body('metadata').optional().isObject()
]);
