import { body, param, query } from 'express-validator';
import { runValidations } from '../utils/validation.js';

const uuidMessage = 'must be a valid UUID';

export const listWaitlistValidation = runValidations([
  query('status').optional().isIn(['active', 'promoted', 'cancelled']),
  query('providerUserId').optional().isUUID().withMessage(uuidMessage),
  query('priority').optional().isIn(['low', 'medium', 'high'])
]);

export const createWaitlistValidation = runValidations([
  body('clientUserId').isUUID().withMessage(uuidMessage),
  body('providerUserId').optional().isUUID().withMessage(uuidMessage),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['active', 'promoted', 'cancelled']),
  body('requestedStart').optional().isISO8601(),
  body('requestedEnd').optional().isISO8601(),
  body('autoPromote').optional().isBoolean(),
  body('notes').optional().isLength({ max: 1000 })
]);

export const waitlistIdParamValidation = runValidations([
  param('entryId').isUUID().withMessage(uuidMessage)
]);

export const updateWaitlistValidation = runValidations([
  param('entryId').isUUID().withMessage(uuidMessage),
  body('clientUserId').optional().isUUID().withMessage(uuidMessage),
  body('providerUserId').optional().isUUID().withMessage(uuidMessage),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['active', 'promoted', 'cancelled']),
  body('requestedStart').optional().isISO8601(),
  body('requestedEnd').optional().isISO8601(),
  body('autoPromote').optional().isBoolean(),
  body('notes').optional().isLength({ max: 1000 })
]);
