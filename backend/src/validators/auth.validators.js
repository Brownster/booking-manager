import { body } from 'express-validator';
import { runValidations } from '../utils/validation.js';

export const registerValidation = runValidations([
  body('tenantId').isUUID().withMessage('tenantId must be a valid UUID'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })
    .withMessage('Password must be at least 8 characters with upper, lower, and numeric characters'),
  body('firstName').optional().isLength({ max: 120 }).withMessage('firstName too long'),
  body('lastName').optional().isLength({ max: 120 }).withMessage('lastName too long'),
  body('role').optional().isIn(['user', 'admin', 'provider']).withMessage('Invalid role')
]);

export const loginValidation = runValidations([
  body('tenantId').isUUID().withMessage('tenantId must be a valid UUID'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
]);

export const refreshValidation = runValidations([
  body('refreshToken').optional().isString().withMessage('refreshToken must be a string')
]);
