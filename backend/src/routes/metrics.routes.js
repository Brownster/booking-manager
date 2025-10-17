import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import { getDashboardMetricsController } from '../controllers/metrics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requirePermissions(['metrics:read']), getDashboardMetricsController);

export default router;
