import { ApiError, serializeError } from '../utils/error.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const error = err instanceof ApiError ? err : new ApiError(err.status || 500, err.message);

  if (process.env.NODE_ENV !== 'test') {
    console.error('API Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path
    });
  }

  res.status(error.status).json({
    error: serializeError(error)
  });
};
