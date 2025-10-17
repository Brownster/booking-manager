import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import {
  createSlot,
  listSlots,
  updateSlot,
  deleteSlot,
  searchAvailabilityController
} from '../controllers/availability.controller.js';
import {
  listSlotsValidation,
  createSlotValidation,
  updateSlotValidation,
  deleteSlotValidation,
  searchAvailabilityValidation
} from '../validators/availability.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/:calendarId/slots',
  requirePermissions(['availability:read'], { legacyRoles: ['admin', 'provider'] }),
  listSlotsValidation,
  listSlots
);
router.post(
  '/:calendarId/slots',
  requirePermissions(['availability:create'], { legacyRoles: ['admin'] }),
  createSlotValidation,
  createSlot
);
router.put(
  '/:calendarId/slots/:slotId',
  requirePermissions(['availability:update'], { legacyRoles: ['admin'] }),
  updateSlotValidation,
  updateSlot
);
router.delete(
  '/:calendarId/slots/:slotId',
  requirePermissions(['availability:delete'], { legacyRoles: ['admin'] }),
  deleteSlotValidation,
  deleteSlot
);

router.post(
  '/search',
  requirePermissions(['availability:read'], { legacyRoles: ['admin', 'provider', 'user'] }),
  searchAvailabilityValidation,
  searchAvailabilityController
);

export default router;
