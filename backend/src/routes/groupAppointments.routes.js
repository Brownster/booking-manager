import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import {
  createGroupAppointmentController,
  listGroupAppointmentsController,
  getGroupAppointmentController,
  updateGroupAppointmentController,
  cancelGroupAppointmentController,
  respondProviderController,
  respondParticipantController,
  deleteGroupAppointmentController
} from '../controllers/groupAppointment.controller.js';
import {
  createGroupAppointmentValidation,
  listGroupAppointmentValidation,
  groupAppointmentIdParamValidation,
  updateGroupAppointmentValidation,
  providerResponseValidation,
  participantResponseValidation
} from '../validators/groupAppointment.validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions(['groupAppointments:read'], { legacyRoles: ['admin', 'provider'] }),
  listGroupAppointmentValidation,
  listGroupAppointmentsController
);

router.post(
  '/',
  requirePermissions(['groupAppointments:create'], { legacyRoles: ['admin'] }),
  createGroupAppointmentValidation,
  createGroupAppointmentController
);

router.get(
  '/:groupAppointmentId',
  requirePermissions(['groupAppointments:read'], { legacyRoles: ['admin', 'provider'] }),
  groupAppointmentIdParamValidation,
  getGroupAppointmentController
);

router.put(
  '/:groupAppointmentId',
  requirePermissions(['groupAppointments:update'], { legacyRoles: ['admin'] }),
  updateGroupAppointmentValidation,
  updateGroupAppointmentController
);

router.post(
  '/:groupAppointmentId/cancel',
  requirePermissions(['groupAppointments:delete'], { legacyRoles: ['admin'] }),
  groupAppointmentIdParamValidation,
  cancelGroupAppointmentController
);

router.post(
  '/:groupAppointmentId/providers/:providerUserId/respond',
  requirePermissions(['groupAppointments:read'], { legacyRoles: ['admin', 'provider'] }),
  providerResponseValidation,
  respondProviderController
);

router.post(
  '/:groupAppointmentId/participants/:participantUserId/respond',
  requirePermissions(['groupAppointments:read'], { legacyRoles: ['admin', 'provider'] }),
  participantResponseValidation,
  respondParticipantController
);

router.delete(
  '/:groupAppointmentId',
  requirePermissions(['groupAppointments:delete'], { legacyRoles: ['admin'] }),
  groupAppointmentIdParamValidation,
  deleteGroupAppointmentController
);

export default router;
