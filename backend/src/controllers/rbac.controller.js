import {
  listAllPermissions,
  listTenantRoles,
  createTenantRole,
  getRoleDetails,
  updateTenantRole,
  deleteTenantRole,
  assignRoleToUser,
  removeRoleFromUser,
  listUserRolesForTenant,
  getUserPermissionContext
} from '../services/rbac.service.js';
import { findById } from '../repositories/user.repository.js';
import { ApiError } from '../utils/error.js';

const ensureUserInTenant = async (tenantId, userId) => {
  const user = await findById(userId);
  if (!user || user.tenant_id !== tenantId) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const listPermissionsController = async (req, res, next) => {
  try {
    const permissions = await listAllPermissions();
    res.status(200).json({ permissions });
  } catch (error) {
    next(error);
  }
};

export const listRolesController = async (req, res, next) => {
  try {
    const roles = await listTenantRoles(req.user.tenantId);
    res.status(200).json({ roles });
  } catch (error) {
    next(error);
  }
};

export const createRoleController = async (req, res, next) => {
  try {
    const { name, description, permissionIds } = req.body;
    const role = await createTenantRole({
      tenantId: req.user.tenantId,
      name,
      description,
      permissionIds,
      createdBy: req.user.id
    });

    res.status(201).json({ role });
  } catch (error) {
    next(error);
  }
};

export const getRoleController = async (req, res, next) => {
  try {
    const role = await getRoleDetails(req.user.tenantId, req.params.roleId);
    if (!role) {
      throw new ApiError(404, 'Role not found');
    }
    res.status(200).json({ role });
  } catch (error) {
    next(error);
  }
};

export const updateRoleController = async (req, res, next) => {
  try {
    const { name, description, permissionIds } = req.body;
    const role = await updateTenantRole({
      tenantId: req.user.tenantId,
      roleId: req.params.roleId,
      name,
      description,
      permissionIds,
      updatedBy: req.user.id
    });

    res.status(200).json({ role });
  } catch (error) {
    next(error);
  }
};

export const deleteRoleController = async (req, res, next) => {
  try {
    await deleteTenantRole({
      tenantId: req.user.tenantId,
      roleId: req.params.roleId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listUserRolesController = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    await ensureUserInTenant(req.user.tenantId, targetUserId);
    const roles = await listUserRolesForTenant(req.user.tenantId, targetUserId);
    res.status(200).json({ roles });
  } catch (error) {
    next(error);
  }
};

export const assignRoleToUserController = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    await ensureUserInTenant(req.user.tenantId, targetUserId);

    const { roleId, expiresAt } = req.body;
    await assignRoleToUser({
      tenantId: req.user.tenantId,
      userId: targetUserId,
      roleId,
      assignedBy: req.user.id,
      expiresAt
    });

    const roles = await listUserRolesForTenant(req.user.tenantId, targetUserId);
    res.status(200).json({ roles });
  } catch (error) {
    next(error);
  }
};

export const removeRoleFromUserController = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    await ensureUserInTenant(req.user.tenantId, targetUserId);

    const { roleId } = req.params;
    await removeRoleFromUser({
      tenantId: req.user.tenantId,
      userId: targetUserId,
      roleId
    });

    const roles = await listUserRolesForTenant(req.user.tenantId, targetUserId);
    res.status(200).json({ roles });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserPermissionsController = async (req, res, next) => {
  try {
    const context = await getUserPermissionContext(req.user.tenantId, req.user.id);
    res.status(200).json({
      roles: context.roles,
      permissions: context.permissions,
      cachedAt: context.cachedAt,
      expiresAt: context.expiresAt
    });
  } catch (error) {
    next(error);
  }
};
