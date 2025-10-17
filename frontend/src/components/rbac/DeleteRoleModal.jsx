import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

export const DeleteRoleModal = ({ isOpen, onClose, role, onConfirm, isSubmitting = false, error }) => {
  if (!role) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Role"
      description={`Are you sure you want to delete "${role.name}"?`}
    >
      <ModalBody>
        <p>
          This action cannot be undone. Any users assigned to this role will lose the associated permissions.
        </p>
        {error && (
          <p className="role-form__error" role="alert">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onConfirm?.(role)} loading={isSubmitting}>
          Delete Role
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteRoleModal;
