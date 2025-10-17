import { Card, CardContent, CardTitle } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import './page-layout.css';

export const AppointmentsPage = () => (
  <div className="page">
    <header className="page__header">
      <div>
        <h1 className="page__title">Appointments</h1>
        <p className="page__subtitle">
          Search, filter, and manage appointments across your tenant. Upcoming implementations will
          include full CRUD with conflict detection.
        </p>
      </div>
      <Button variant="primary">New Appointment</Button>
    </header>

    <Card>
      <CardTitle>Coming Soon</CardTitle>
      <CardContent>
        <p>
          The Phase 2 interface will allow you to filter by provider, skill, status, and date range.
          Expect timeline and list views with inline actions.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default AppointmentsPage;
