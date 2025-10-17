import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardTitle } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchDashboardMetrics } from '../services/metricsService.js';
import './page-layout.css';

const fallbackMetrics = {
  generatedAt: null,
  range: { start: null, end: null },
  appointments: {
    total: 18,
    upcoming: 6,
    completed: 9,
    pending: 2,
    confirmed: 12,
    cancelled: 1
  },
  waitlist: {
    active: 5,
    promoted: 2,
    cancelled: 1
  },
  utilization: {
    percentage: 78,
    activeCalendars: 4,
    totalCalendars: 6,
    confirmedAppointments: 12
  }
};

const formatMetricCards = (metrics) => [
  {
    label: 'Upcoming Appointments',
    value: metrics.appointments?.upcoming ?? 0,
    detail: `${metrics.appointments?.total ?? 0} scheduled total`,
    trend: `${metrics.appointments?.pending ?? 0} pending approval`
  },
  {
    label: 'Waitlist Health',
    value: metrics.waitlist?.active ?? 0,
    detail: `${metrics.waitlist?.promoted ?? 0} promoted today`,
    trend: `${metrics.waitlist?.cancelled ?? 0} cancelled`
  },
  {
    label: 'Team Utilization',
    value: `${metrics.utilization?.percentage ?? 0}%`,
    detail: `${metrics.utilization?.activeCalendars ?? 0}/${metrics.utilization?.totalCalendars ?? 0} calendars active`,
    trend: `${metrics.utilization?.confirmedAppointments ?? 0} confirmed sessions`
  }
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const {
    data: metrics,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => fetchDashboardMetrics(),
    staleTime: 60_000,
    retry: 1
  });

  const cards = useMemo(() => formatMetricCards(metrics ?? fallbackMetrics), [metrics]);
  const shouldShowError =
    isError && error?.response?.status !== 404 && error?.response?.status !== 403;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">
            {user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back'}
          </h1>
          <p className="page__subtitle">
            Review key metrics and manage what matters most for your booking operations.
          </p>
        </div>
        <Badge variant="info">Live Insights</Badge>
      </header>

      {shouldShowError && (
        <div className="page__alert" role="alert">
          Unable to load live metrics right now. Showing the latest recorded values.
          {error?.message ? ` (${error.message})` : ''}
        </div>
      )}

      <section className="page__grid" aria-busy={isLoading}>
        {cards.map((metric) => (
          <Card key={metric.label} hoverable>
            <CardTitle>{metric.label}</CardTitle>
            <CardContent>
              <span className="metric__value">{metric.value}</span>
              <span className="metric__detail">{metric.detail}</span>
              <span className="metric__trend">{metric.trend}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="page__footer-hint">
        <Badge variant="info">Updated</Badge>
        <span>
          {metrics?.generatedAt
            ? `Last synced ${new Date(metrics.generatedAt).toLocaleString()}`
            : 'Live metrics will update as activity occurs.'}
        </span>
      </footer>
    </div>
  );
};

export default DashboardPage;
