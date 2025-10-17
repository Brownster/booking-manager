import { body, param, query } from 'express-validator';
import { runValidations } from '../utils/validation.js';

export const createSkillValidation = runValidations([
  body('name').isString().isLength({ min: 2, max: 120 }),
  body('category').optional().isLength({ max: 120 }),
  body('description').optional().isLength({ max: 500 })
]);

export const updateSkillValidation = runValidations([
  param('skillId').isUUID().withMessage('skillId must be a UUID'),
  body('name').optional().isLength({ min: 2, max: 120 }),
  body('category').optional().isLength({ max: 120 }),
  body('description').optional().isLength({ max: 500 })
]);

export const deleteSkillValidation = runValidations([
  param('skillId').isUUID().withMessage('skillId must be a UUID')
]);

export const listSkillsValidation = runValidations([
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
]);
