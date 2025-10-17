import {
  listRoles,
  createRoleWithPermissions,
  getRoleById,
  getRoleByName,
  deleteRole,
  updateRole,
  getRoleWithPermissions
} from '../repositories/role.repository.js';
import {
  addPermissionsToRole,
  removePermissionsFromRole,
  listRolePermissions
} from '../repositories/rolePermission.repository.js';
import {
  assignRoleToUser as assignRoleToUserRepo,
  removeRoleFromUser as removeRoleFromUserRepo,
  listUserRoles,
  getUserPermissions,
  getUserIdsByRole
} from '../repositories/userRole.repository.js';
import { listPermissions, getPermissionsByIds } from '../repositories/permission.repository.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import { ApiError } from '../utils/error.js';

const cacheEnabled = (process.env.RBAC_ENABLE_CACHING || 'true').toLowerCase() !== 'false';
const cacheTtl = parseInt(process.env.RBAC_CACHE_TTL || '3600', 10);
const defaultRoleName = process.env.RBAC_DEFAULT_ROLE || 'client';

const buildCacheKey = (tenantId, userId) => `rbac:tenant:${tenantId}:user:${userId}`;

const mapRoleAssignment = (role) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  is_system: role.is_system,
  assigned_at: role.assigned_at,
  assigned_by: role.assigned_by,
  expires_at: role.expires_at
});

const serializeUserContext = (roles, permissions) => ({
  roles: roles.map((role) => ({
    id: role.id,
    name: role.name,
    is_system: role.is_system
  })),
  roleIds: roles.map((role) => role.id),
  permissions,
  cachedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + cacheTtl * 1000).toISOString()
});

const fetchUserContext = async (tenantId, userId) => {
  const [roles, permissions] = await Promise.all([
    listUserRoles({ userId, tenantId }),
    getUserPermissions({ userId, tenantId })
  ]);

  return serializeUserContext(roles, permissions);
};

const setUserContextCache = async (tenantId, userId, context) => {
  if (!cacheEnabled) {
    return;
  }
  await cacheSet(buildCacheKey(tenantId, userId), context, cacheTtl);
};

export const invalidateUserPermissions = async (tenantId, userId) => {
  if (!cacheEnabled) {
    return;
  }
  await cacheDel(buildCacheKey(tenantId, userId));
};

export const getUserPermissionContext = async (tenantId, userId) => {
  if (cacheEnabled) {
    const cached = await cacheGet(buildCacheKey(tenantId, userId));
    if (cached) {
      return cached;
    }
  }

  const context = await fetchUserContext(tenantId, userId);
  await setUserContextCache(tenantId, userId, context);
  return context;
};

export const getUserPermissionSet = async (tenantId, userId) => {
  const context = await getUserPermissionContext(tenantId, userId);
  return new Set(context.permissions);
};

export const userHasPermission = async (tenantId, userId, permission) => {
  const permissions = await getUserPermissionSet(tenantId, userId);
  return permissions.has(permission);
};

export const userHasAllPermissions = async (tenantId, userId, requiredPermissions = []) => {
  if (!requiredPermissions.length) {
    return true;
  }
  const permissions = await getUserPermissionSet(tenantId, userId);
  return requiredPermissions.every((permission) => permissions.has(permission));
};

export const userHasAnyPermission = async (tenantId, userId, requiredPermissions = []) => {
  if (!requiredPermissions.length) {
    return true;
  }
  const permissions = await getUserPermissionSet(tenantId, userId);
  return requiredPermissions.some((permission) => permissions.has(permission));
};

export const assignRoleToUser = async ({ tenantId, userId, roleId, assignedBy, expiresAt }) => {
  const role = await getRoleById(tenantId, roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  await assignRoleToUserRepo({ userId, roleId, assignedBy, expiresAt });
  await invalidateUserPermissions(tenantId, userId);
};

export const removeRoleFromUser = async ({ tenantId, userId, roleId }) => {
  await removeRoleFromUserRepo({ userId, roleId });
  await invalidateUserPermissions(tenantId, userId);
};

export const assignDefaultRoleToUser = async ({ tenantId, userId }) => {
  if (!defaultRoleName) {
    return;
  }

  const role = await getRoleByName(tenantId, defaultRoleName);
  if (!role) {
    return;
  }

  await assignRoleToUserRepo({ userId, roleId: role.id, assignedBy: null });
  await invalidateUserPermissions(tenantId, userId);
};

export const listTenantRoles = async (tenantId) => listRoles(tenantId);

export const getRoleDetails = async (tenantId, roleId) => getRoleWithPermissions(tenantId, roleId);

export const createTenantRole = async ({ tenantId, name, description, permissionIds, createdBy }) => {
  if (!permissionIds?.length) {
    throw new ApiError(400, 'At least one permission is required');
  }

  const uniquePermissionIds = [...new Set(permissionIds)];

  const permissions = await getPermissionsByIds(uniquePermissionIds);
  if (permissions.length !== uniquePermissionIds.length) {
    throw new ApiError(400, 'One or more permissions are invalid');
  }

  const existing = await getRoleByName(tenantId, name);
  if (existing) {
    throw new ApiError(409, 'Role name already exists');
  }

  const role = await createRoleWithPermissions({
    tenantId,
    name,
    description,
    permissionIds: uniquePermissionIds,
    isSystem: false,
    grantedBy: createdBy
  });

  return getRoleWithPermissions(tenantId, role.id);
};

export const updateTenantRole = async ({
  tenantId,
  roleId,
  name,
  description,
  permissionIds,
  updatedBy
}) => {
  const role = await getRoleById(tenantId, roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  if (role.is_system) {
    throw new ApiError(400, 'System roles cannot be modified');
  }

  const updates = {};
  if (name && name !== role.name) {
    const conflict = await getRoleByName(tenantId, name);
    if (conflict) {
      throw new ApiError(409, 'Role name already exists');
    }
    updates.name = name;
  }
  if (description !== undefined) {
    updates.description = description;
  }

  if (Object.keys(updates).length) {
    await updateRole(tenantId, roleId, updates);
  }

  if (permissionIds) {
    const uniquePermissionIds = [...new Set(permissionIds)];
    const permissions = await getPermissionsByIds(uniquePermissionIds);
    if (permissions.length !== uniquePermissionIds.length) {
      throw new ApiError(400, 'One or more permissions are invalid');
    }

    const currentPermissionIds = await listRolePermissions(roleId);
    const toAdd = uniquePermissionIds.filter((id) => !currentPermissionIds.includes(id));
    const toRemove = currentPermissionIds.filter((id) => !uniquePermissionIds.includes(id));

    if (toAdd.length) {
      await addPermissionsToRole({ roleId, permissionIds: toAdd, grantedBy: updatedBy });
    }
    if (toRemove.length) {
      await removePermissionsFromRole({ roleId, permissionIds: toRemove });
    }
  }

  // Invalidate all users with this role
  const userIds = await getUserIdsByRole({ tenantId, roleId });
  await Promise.all(userIds.map(async (userId) => invalidateUserPermissions(tenantId, userId))).catch(
    () => {}
  );

  return getRoleWithPermissions(tenantId, roleId);
};

export const deleteTenantRole = async ({ tenantId, roleId }) => {
  const userIds = await getUserIdsByRole({ tenantId, roleId });
  const deleted = await deleteRole(tenantId, roleId);
  if (!deleted) {
    throw new ApiError(404, 'Role not found or cannot be deleted');
  }
  await Promise.all(userIds.map(async (userId) => invalidateUserPermissions(tenantId, userId))).catch(
    () => {}
  );
  return deleted;
};

export const listAllPermissions = async () => listPermissions();

export const listUserRolesForTenant = async (tenantId, userId) => {
  const roles = await listUserRoles({ tenantId, userId });
  return roles.map(mapRoleAssignment);
};
