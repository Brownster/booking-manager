import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../utils/error.js';
import { findById } from '../repositories/user.repository.js';

const extractToken = (req) => {
  const header = req.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyAccessToken(token);
    const user = await findById(payload.sub);

    if (!user || user.status !== 'active') {
      throw new AuthenticationError('User account is not active');
    }

    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      email: user.email
    };
    req.authToken = token;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError());
  }

  if (!roles.length) {
    return next();
  }

  if (!roles.includes(req.user.role)) {
    return next(new AuthorizationError());
  }

  return next();
};
