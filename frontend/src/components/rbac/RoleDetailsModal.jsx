import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import './rbac.css';

const groupPermissions = (permissions = []) =>
  permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

export const RoleDetailsModal = ({
  isOpen,
  onClose,
  role,
  permissionsCatalog = [],
  selectedPermissionNames = []
}) => {
  const selectedSet = new Set(selectedPermissionNames);
  const grouped = groupPermissions(permissionsCatalog);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={role?.name} description={role?.description}>
      <ModalBody>
        {Object.entries(grouped).map(([resource, permissions]) => (
          <section key={resource}>
            <h3>{resource}</h3>
            <div className="permission-grid">
              {permissions.map((permission) => (
                <label key={permission.id} className="permission-item">
                  <input type="checkbox" checked={selectedSet.has(permission.name)} readOnly />
                  {permission.action}
                </label>
              ))}
            </div>
          </section>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RoleDetailsModal;
