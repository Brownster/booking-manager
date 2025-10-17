import { ApiError } from '../utils/error.js';
import {
  getUserPermissionContext,
  userHasAllPermissions,
  userHasAnyPermission
} from '../services/rbac.service.js';

const ensureAuthenticatedUser = (req) => {
  if (!req.user || !req.user.id || !req.user.tenantId) {
    throw new ApiError(401, 'Authentication required');
  }
};

export const attachPermissionContext = async (req, res, next) => {
  try {
    ensureAuthenticatedUser(req);
    const context = await getUserPermissionContext(req.user.tenantId, req.user.id);
    req.auth = {
      ...(req.auth || {}),
      permissions: new Set(context.permissions),
      roles: context.roles,
      roleIds: context.roleIds
    };
    next();
  } catch (error) {
    next(error);
  }
};

const normalizePermissions = (permissions) => {
  if (!permissions) {
    return [];
  }
  if (Array.isArray(permissions)) {
    return permissions;
  }
  return [permissions];
};

export const requirePermissions = (permissions, options = {}) => {
  const normalized = normalizePermissions(permissions);
  const mode = options.mode || 'all';
  const legacyRoles = options.legacyRoles || [];

  return async (req, res, next) => {
    try {
      ensureAuthenticatedUser(req);
      if (!normalized.length) {
        return next();
      }

      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const hasPermissions =
        mode === 'any'
          ? await userHasAnyPermission(tenantId, userId, normalized)
          : await userHasAllPermissions(tenantId, userId, normalized);

      if (!hasPermissions) {
        if (legacyRoles.length && req.user?.role && legacyRoles.includes(req.user.role)) {
          return next();
        }
        throw new ApiError(403, 'Insufficient permissions', {
          required: normalized,
          mode
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAnyPermission = (permissions) =>
  requirePermissions(permissions, { mode: 'any' });
