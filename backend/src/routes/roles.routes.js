import { Router } from 'express';
import { requirePermissions } from '../middleware/rbac.middleware.js';

export const createRolesRouter = (handlers) => {
  const {
    listRoles,
    createRole,
    getRole,
    updateRole,
    deleteRole
  } = handlers;

  const router = Router();

  router.get('/', requirePermissions(['roles:read']), listRoles);
  router.post('/', requirePermissions(['roles:create']), createRole);
  router.get('/:roleId', requirePermissions(['roles:read']), getRole);
  router.put('/:roleId', requirePermissions(['roles:update']), updateRole);
  router.delete('/:roleId', requirePermissions(['roles:delete']), deleteRole);

  return router;
};

export default createRolesRouter;
