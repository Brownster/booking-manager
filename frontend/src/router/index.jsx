import { Routes, Route } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import AppointmentsPage from '../pages/AppointmentsPage.jsx';
import AvailabilityPage from '../pages/AvailabilityPage.jsx';
import WaitlistPage from '../pages/WaitlistPage.jsx';
import GroupBookingsPage from '../pages/GroupBookingsPage.jsx';
import AdminRolesPage from '../pages/AdminRolesPage.jsx';
import AdminAuditPage from '../pages/AdminAuditPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} />
      <Route path="/availability" element={<AvailabilityPage />} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/group-bookings" element={<GroupBookingsPage />} />
      <Route path="/admin/roles" element={<AdminRolesPage />} />
      <Route path="/admin/audit" element={<AdminAuditPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
