export class ApiError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message, errors = []) {
    super(422, message, { errors });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}

export const serializeError = (error) => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      ...error.details
    };
  }

  return {
    message: 'Internal Server Error',
    status: 500
  };
};
