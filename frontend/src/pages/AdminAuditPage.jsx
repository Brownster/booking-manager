import { Card, CardContent, CardTitle } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import './page-layout.css';

const mockAuditEntries = [
  {
    id: 'audit-1',
    actor: 'Ada Lovelace',
    action: 'roles.assign',
    resource: 'user:0002',
    timestamp: '2025-10-16T09:45:00Z'
  },
  {
    id: 'audit-2',
    actor: 'Grace Hopper',
    action: 'appointments.cancel',
    resource: 'appointment:1234',
    timestamp: '2025-10-16T08:10:00Z'
  }
];

export const AdminAuditPage = () => (
  <div className="page">
    <header className="page__header">
      <div>
        <h1 className="page__title">Audit Logs</h1>
        <p className="page__subtitle">
          Observe security-sensitive operations across your tenant. Filters and export options will
          arrive later in Phase 2.
        </p>
      </div>
      <Badge variant="warning">Logs stream coming soon</Badge>
    </header>

    <div className="page__stack">
      {mockAuditEntries.map((entry) => (
        <Card key={entry.id}>
          <CardTitle>{entry.action}</CardTitle>
          <CardContent>
            <p>
              <strong>Actor:</strong> {entry.actor}
            </p>
            <p>
              <strong>Resource:</strong> {entry.resource}
            </p>
            <p>
              <strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default AdminAuditPage;
