import { body, param } from 'express-validator';
import { runValidations } from '../utils/validation.js';

export const roleIdParamValidation = runValidations([
  param('roleId').isUUID().withMessage('roleId must be a valid UUID')
]);

export const userIdParamValidation = runValidations([
  param('userId').isUUID().withMessage('userId must be a valid UUID')
]);

export const createRoleValidation = runValidations([
  body('name').isString().isLength({ min: 2, max: 50 }),
  body('description').optional().isLength({ max: 255 }),
  body('permissionIds').isArray({ min: 1 }),
  body('permissionIds.*').isUUID().withMessage('permissionIds must contain valid UUIDs')
]);

export const updateRoleValidation = runValidations([
  param('roleId').isUUID().withMessage('roleId must be a valid UUID'),
  body('name').optional().isString().isLength({ min: 2, max: 50 }),
  body('description').optional().isLength({ max: 255 }),
  body('permissionIds').optional().isArray({ min: 1 }),
  body('permissionIds.*').optional().isUUID().withMessage('permissionIds must contain valid UUIDs')
]);

export const assignRoleValidation = runValidations([
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('roleId').isUUID().withMessage('roleId must be a valid UUID'),
  body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid ISO date')
]);

export const removeRoleValidation = runValidations([
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  param('roleId').isUUID().withMessage('roleId must be a valid UUID')
]);
