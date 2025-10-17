import jwt from 'jsonwebtoken';
import { AuthenticationError } from './error.js';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '1h';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const ISSUER = process.env.TOKEN_ISSUER || 'calendar-booking-system';
const AUDIENCE = process.env.TOKEN_AUDIENCE || 'calendar-booking-clients';

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not set');
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not set');
  }
  return secret;
};

const buildPayload = (user) => ({
  sub: user.id,
  tenantId: user.tenant_id,
  role: user.role,
  email: user.email
});

export const issueAccessToken = (user) =>
  jwt.sign(buildPayload(user), getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: ISSUER,
    audience: AUDIENCE
  });

export const issueRefreshToken = (user) =>
  jwt.sign(buildPayload(user), getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_TTL,
    issuer: ISSUER,
    audience: AUDIENCE
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getAccessSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE
    });
  } catch (error) {
    throw new AuthenticationError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getRefreshSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE
    });
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
};

export const decodeToken = (token) => jwt.decode(token, { complete: true });
