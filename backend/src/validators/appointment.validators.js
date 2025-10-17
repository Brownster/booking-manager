import { body, param, query } from 'express-validator';
import { runValidations } from '../utils/validation.js';

export const createAppointmentValidation = runValidations([
  body('calendarId').isUUID(),
  body('clientUserId').isUUID(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('requiredSkills').optional().isArray(),
  body('requiredSkills.*').optional().isUUID()
]);

export const listAppointmentsValidation = runValidations([
  query('calendarId').isUUID(),
  query('start').optional().isISO8601(),
  query('end').optional().isISO8601()
]);

export const getAppointmentValidation = runValidations([
  param('appointmentId').isUUID()
]);

export const updateAppointmentValidation = runValidations([
  param('appointmentId').isUUID(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled'])
]);

export const cancelAppointmentValidation = runValidations([
  param('appointmentId').isUUID()
]);

export const deleteAppointmentValidation = cancelAppointmentValidation;
