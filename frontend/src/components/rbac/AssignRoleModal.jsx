import { useEffect, useMemo, useState } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import './rbac.css';

const sampleUsers = [
  { id: 'user-1', name: 'Mike Davis', email: 'mike@example.com', roles: ['Provider'] },
  { id: 'user-2', name: 'Jessica Smith', email: 'jessica@example.com', roles: ['Support'] },
  { id: 'user-3', name: 'Tom Wilson', email: 'tom@example.com', roles: ['Client'] }
];

const initials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

export const AssignRoleModal = ({
  isOpen,
  onClose,
  role,
  onAssign,
  users = sampleUsers,
  isSubmitting = false
}) => {
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? '');

  useEffect(() => {
    if (isOpen) {
      setSelectedId(users[0]?.id ?? '');
    }
  }, [isOpen, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedId),
    [users, selectedId]
  );

  const handleAssign = () => {
    if (selectedUser) {
      onAssign?.(selectedUser, role);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Role" description={role?.name}>
      <ModalBody>
        <p>Select a user to assign this role (placeholder data for now).</p>
        <div className="user-list">
          {users.map((user) => (
            <label key={user.id} className="user-list__item">
              <input
                type="radio"
                name="role-assignment"
                value={user.id}
                checked={selectedId === user.id}
                onChange={() => setSelectedId(user.id)}
              />
              <span className="user-list__avatar">{initials(user.name)}</span>
              <div>
                <div>{user.name}</div>
                <div className="role-chip">{user.roles.join(', ')}</div>
              </div>
            </label>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAssign} disabled={isSubmitting} loading={isSubmitting}>
          Assign Role
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AssignRoleModal;
