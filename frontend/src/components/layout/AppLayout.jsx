import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFeatureFlags } from '../../context/FeatureFlagContext.jsx';
import PermissionGate from '../auth/PermissionGate.jsx';
import Button from '../ui/Button.jsx';
import './app-layout.css';

const navConfig = [
  {
    label: 'Dashboard',
    to: '/',
    permissions: []
  },
  {
    label: 'Appointments',
    to: '/appointments',
    permissions: ['appointments:read']
  },
  {
    label: 'Availability',
    to: '/availability',
    permissions: ['availability:read']
  },
  {
    label: 'Waitlist',
    to: '/waitlist',
    permissions: ['waitlist:read']
  },
  {
    label: 'Group Bookings',
    to: '/group-bookings',
    permissions: ['groupAppointments:read'],
    featureFlag: 'groupBookings'
  },
  {
    label: 'Roles & Permissions',
    to: '/admin/roles',
    permissions: ['roles:read']
  },
  {
    label: 'Audit Logs',
    to: '/admin/audit',
    permissions: ['audit:read']
  }
];

const getInitials = (user) => {
  if (!user) {
    return '';
  }
  const first = user.firstName?.[0] ?? '';
  const last = user.lastName?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
};

export const AppLayout = () => {
  const { user, logout, isLoading } = useAuth();
  const featureFlags = useFeatureFlags();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <span className="app-shell__logo" aria-hidden="true">
            📅
          </span>
          <div>
            <span className="app-shell__brand-name">Calendar Booking</span>
            <span className="app-shell__brand-subtitle">Phase 2 Preview</span>
          </div>
        </div>
        <nav className="app-shell__nav">
          {navConfig.map((item) => {
            if (item.featureFlag && !featureFlags?.[item.featureFlag]) {
              return null;
            }
            return (
              <PermissionGate key={item.to} permissions={item.permissions}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx('app-shell__nav-link', isActive && 'app-shell__nav-link--active')
                  }
                >
                  {item.label}
                </NavLink>
              </PermissionGate>
            );
          })}
        </nav>
        <div className="app-shell__user">
          <div className="app-shell__identity">
            <div className="app-shell__avatar" aria-hidden="true">
              {getInitials(user)}
            </div>
            <div className="app-shell__user-meta">
              <span className="app-shell__user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="app-shell__user-email">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            disabled={isLoading}
            aria-label="Sign out"
          >
            Sign Out
          </Button>
        </div>
      </header>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
