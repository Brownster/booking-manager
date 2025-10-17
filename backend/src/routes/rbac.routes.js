import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { attachPermissionContext, requirePermissions } from '../middleware/rbac.middleware.js';
import {
  listPermissionsController,
  listRolesController,
  createRoleController,
  getRoleController,
  updateRoleController,
  deleteRoleController,
  listUserRolesController,
  assignRoleToUserController,
  removeRoleFromUserController,
  getCurrentUserPermissionsController
} from '../controllers/rbac.controller.js';
import {
  createRoleValidation,
  updateRoleValidation,
  assignRoleValidation,
  removeRoleValidation,
  roleIdParamValidation,
  userIdParamValidation
} from '../validators/rbac.validators.js';

const router = Router();

router.use(authenticate);

router.get('/me/permissions', attachPermissionContext, getCurrentUserPermissionsController);

router.get(
  '/permissions',
  requirePermissions(['roles:read'], { legacyRoles: ['admin'] }),
  listPermissionsController
);

router.get(
  '/roles',
  requirePermissions(['roles:read'], { legacyRoles: ['admin'] }),
  listRolesController
);

router.post(
  '/roles',
  requirePermissions(['roles:create'], { legacyRoles: ['admin'] }),
  createRoleValidation,
  createRoleController
);

router.get(
  '/roles/:roleId',
  requirePermissions(['roles:read'], { legacyRoles: ['admin'] }),
  roleIdParamValidation,
  getRoleController
);

router.put(
  '/roles/:roleId',
  requirePermissions(['roles:update'], { legacyRoles: ['admin'] }),
  updateRoleValidation,
  updateRoleController
);

router.delete(
  '/roles/:roleId',
  requirePermissions(['roles:delete'], { legacyRoles: ['admin'] }),
  roleIdParamValidation,
  deleteRoleController
);

router.get(
  '/users/:userId/roles',
  requirePermissions(['roles:read'], { legacyRoles: ['admin'] }),
  userIdParamValidation,
  listUserRolesController
);

router.post(
  '/users/:userId/roles',
  requirePermissions(['roles:assign'], { legacyRoles: ['admin'] }),
  assignRoleValidation,
  assignRoleToUserController
);

router.delete(
  '/users/:userId/roles/:roleId',
  requirePermissions(['roles:assign'], { legacyRoles: ['admin'] }),
  removeRoleValidation,
  removeRoleFromUserController
);

export default router;
