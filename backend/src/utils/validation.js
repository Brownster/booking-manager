import { validationResult } from 'express-validator';
import { ValidationError } from './error.js';

export const runValidations = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    // eslint-disable-next-line no-await-in-loop
    await validation.run(req);
  }

  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new ValidationError('Validation failed', result.array()));
  }

  return next();
};
