import { Router } from 'express';
import authRouter from './auth.routes.js';
import skillsRouter from './skills.routes.js';
import calendarsRouter from './calendars.routes.js';
import availabilityRouter from './availability.routes.js';
import appointmentsRouter from './appointments.routes.js';
import rbacRouter from './rbac.routes.js';
import waitlistRouter from './waitlist.routes.js';
import metricsRouter from './metrics.routes.js';
import groupAppointmentsRouter from './groupAppointments.routes.js';

export const registerRoutes = (app) => {
  const router = Router();

  router.use('/auth', authRouter);
  router.use('/skills', skillsRouter);
  router.use('/calendars', calendarsRouter);
  router.use('/availability', availabilityRouter);
  router.use('/appointments', appointmentsRouter);
  router.use('/rbac', rbacRouter);
  router.use('/waitlist', waitlistRouter);
  router.use('/metrics', metricsRouter);
  router.use('/group-appointments', groupAppointmentsRouter);

  app.use('/api/v1', router);
};
