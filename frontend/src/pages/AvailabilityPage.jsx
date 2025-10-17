import { Card, CardContent, CardTitle } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import './page-layout.css';

export const AvailabilityPage = () => (
  <div className="page">
    <header className="page__header">
      <div>
        <h1 className="page__title">Availability</h1>
        <p className="page__subtitle">
          Manage recurring availability slots for providers. This will integrate with the availability
          search algorithm delivered in Phase 1.
        </p>
      </div>
      <Button variant="primary">Add Slot</Button>
    </header>

    <Card>
      <CardTitle>Planner View</CardTitle>
      <CardContent>
        <p>
          A weekly calendar view will appear here, allowing drag-and-drop slot creation, timezone
          normalization, and quick toggles for active schedules.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default AvailabilityPage;
