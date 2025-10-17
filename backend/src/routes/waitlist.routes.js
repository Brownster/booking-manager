import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import {
  listWaitlist,
  createWaitlist,
  getWaitlist,
  updateWaitlist,
  promoteWaitlist,
  cancelWaitlist,
  deleteWaitlist
} from '../controllers/waitlist.controller.js';
import {
  listWaitlistValidation,
  createWaitlistValidation,
  waitlistIdParamValidation,
  updateWaitlistValidation
} from '../validators/waitlist.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions(['waitlist:read'], { legacyRoles: ['admin', 'provider', 'support'] }),
  listWaitlistValidation,
  listWaitlist
);

router.post(
  '/',
  requirePermissions(['waitlist:create'], { legacyRoles: ['admin', 'support'] }),
  createWaitlistValidation,
  createWaitlist
);

router.get(
  '/:entryId',
  requirePermissions(['waitlist:read'], { legacyRoles: ['admin', 'provider', 'support'] }),
  waitlistIdParamValidation,
  getWaitlist
);

router.patch(
  '/:entryId',
  requirePermissions(['waitlist:manage'], { legacyRoles: ['admin', 'support'] }),
  updateWaitlistValidation,
  updateWaitlist
);

router.post(
  '/:entryId/promote',
  requirePermissions(['waitlist:manage'], { legacyRoles: ['admin', 'support'] }),
  waitlistIdParamValidation,
  promoteWaitlist
);

router.post(
  '/:entryId/cancel',
  requirePermissions(['waitlist:manage'], { legacyRoles: ['admin', 'support'] }),
  waitlistIdParamValidation,
  cancelWaitlist
);

router.delete(
  '/:entryId',
  requirePermissions(['waitlist:manage'], { legacyRoles: ['admin', 'support'] }),
  waitlistIdParamValidation,
  deleteWaitlist
);

export default router;
