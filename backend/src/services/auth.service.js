import { findTenantById } from '../repositories/tenant.repository.js';
import { createUser, findByEmail, findById, updateLastLogin } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateTokenPair,
  revokeRefreshToken,
  decodeRefreshToken,
  isRefreshTokenRevoked
} from './token.service.js';
import { ApiError, AuthenticationError } from '../utils/error.js';
import { assignDefaultRoleToUser } from './rbac.service.js';

const sanitizeUser = (user) => ({
  id: user.id,
  tenant_id: user.tenant_id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role,
  status: user.status,
  email_verified: user.email_verified,
  last_login_at: user.last_login_at,
  created_at: user.created_at,
  updated_at: user.updated_at
});

export const registerUser = async ({
  tenantId,
  email,
  password,
  firstName,
  lastName,
  role = 'user'
}) => {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, 'Tenant not found');
  }

  const existing = await findByEmail(tenantId, email);
  if (existing) {
    throw new ApiError(409, 'User already exists for tenant');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    tenantId,
    email,
    passwordHash,
    firstName,
    lastName,
    role
  });

  await assignDefaultRoleToUser({ tenantId, userId: user.id }).catch(() => {});

  const tokens = generateTokenPair(user);
  return { user: sanitizeUser(user), tokens };
};

export const loginUser = async ({ tenantId, email, password }) => {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new AuthenticationError('Invalid email or password');
  }

  const user = await findByEmail(tenantId, email);
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'User account is not active');
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const updatedUser = await updateLastLogin(user.id);
  const tokens = generateTokenPair(updatedUser);
  return { user: sanitizeUser(updatedUser), tokens };
};

export const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required for logout');
  }
  await revokeRefreshToken(refreshToken);
};

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required');
  }

  if (await isRefreshTokenRevoked(refreshToken)) {
    throw new AuthenticationError('Refresh token has been revoked');
  }

  const payload = decodeRefreshToken(refreshToken);
  const user = await findById(payload.sub);
  if (!user || user.status !== 'active') {
    throw new AuthenticationError('User session is no longer valid');
  }

  // Rotate refresh token
  await revokeRefreshToken(refreshToken);
  const tokens = generateTokenPair(user);

  return { user: sanitizeUser(user), tokens };
};

export const getCurrentUser = async (userId) => {
  const user = await findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sanitizeUser(user);
};
