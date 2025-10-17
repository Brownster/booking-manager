import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import './rbac.css';

export const RoleList = ({ roles, onView, onAssign, onEdit, onDelete }) => (
  <div className="role-grid">
    {roles.map((role) => (
      <Card key={role.id} hoverable>
        <CardHeader>
          <CardTitle>{role.name}</CardTitle>
          {role.is_system && <Badge variant="info">System</Badge>}
        </CardHeader>
        <CardContent>
          <p className="role-card__description">
            {role.description || 'No description yet.'}
          </p>
          <div className="role-card__footer">
            <Button variant="ghost" size="sm" onClick={() => onView?.(role)}>
              View
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAssign?.(role)}>
              Assign
            </Button>
            {!role.is_system && (
              <>
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(role)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete?.(role)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default RoleList;
