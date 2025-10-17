import { getDashboardMetrics } from '../services/metrics.service.js';

export const getDashboardMetricsController = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });
    }

    const metrics = await getDashboardMetrics({
      tenantId: req.user.tenantId,
      rangeStart: req.query.start,
      rangeEnd: req.query.end
    });

    res.status(200).json({ metrics });
  } catch (error) {
    next(error);
  }
};
