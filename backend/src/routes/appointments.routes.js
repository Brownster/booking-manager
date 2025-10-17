import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import {
  createAppointment,
  listAppointmentsController,
  getAppointment,
  updateAppointmentController,
  cancelAppointmentController,
  deleteAppointmentController
} from '../controllers/appointment.controller.js';
import {
  createAppointmentValidation,
  listAppointmentsValidation,
  getAppointmentValidation,
  updateAppointmentValidation,
  cancelAppointmentValidation,
  deleteAppointmentValidation
} from '../validators/appointment.validators.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermissions(['appointments:create'], { legacyRoles: ['admin', 'user', 'provider'] }),
  createAppointmentValidation,
  createAppointment
);
router.get(
  '/',
  requirePermissions(['appointments:read'], { legacyRoles: ['admin', 'provider', 'user'] }),
  listAppointmentsValidation,
  listAppointmentsController
);
router.get(
  '/:appointmentId',
  requirePermissions(['appointments:read'], { legacyRoles: ['admin', 'provider', 'user'] }),
  getAppointmentValidation,
  getAppointment
);
router.put(
  '/:appointmentId',
  requirePermissions(['appointments:update'], { legacyRoles: ['admin', 'provider'] }),
  updateAppointmentValidation,
  updateAppointmentController
);
router.post(
  '/:appointmentId/cancel',
  requirePermissions(['appointments:delete'], { legacyRoles: ['admin', 'provider', 'user'] }),
  cancelAppointmentValidation,
  cancelAppointmentController
);
router.delete(
  '/:appointmentId',
  requirePermissions(['appointments:delete'], { legacyRoles: ['admin', 'provider'] }),
  deleteAppointmentValidation,
  deleteAppointmentController
);

export default router;
