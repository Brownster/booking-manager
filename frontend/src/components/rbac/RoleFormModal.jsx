import { useEffect, useMemo, useState } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import '../../pages/group.css';

const groupByResource = (permissions) =>
  permissions.reduce((acc, permission) => {
    const resource = permission.resource || 'general';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {});

const RoleFormModal = ({
  isOpen,
  mode = 'create',
  role,
  permissionsCatalog = [],
  onClose,
  onSubmit,
  isSubmitting = false,
  error
}) => {
  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setForm({
          name: role.name,
          description: role.description || '',
          permissionIds: role.permissions?.map((permission) => permission.name) || []
        });
      } else {
        setForm({ name: '', description: '', permissionIds: [] });
      }
    }
  }, [isOpen, mode, role]);

  const groupedPermissions = useMemo(() => groupByResource(permissionsCatalog), [permissionsCatalog]);
  const permissionNames = useMemo(
    () => Object.fromEntries(permissionsCatalog.map((permission) => [permission.name, permission.id])),
    [permissionsCatalog]
  );

  const togglePermission = (permissionName) => {
    setForm((prev) => {
      if (prev.permissionIds.includes(permissionName)) {
        return { ...prev, permissionIds: prev.permissionIds.filter((name) => name !== permissionName) };
      }
      return { ...prev, permissionIds: [...prev.permissionIds, permissionName] };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      permissionIds: form.permissionIds.map((name) => permissionNames[name]).filter(Boolean)
    };
    onSubmit?.(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={mode === 'edit' ? 'Edit Role' : 'Create Role'}
    >
      <ModalBody>
        <form id="role-form" className="role-form" onSubmit={handleSubmit}>
          <label className="role-form__field">
            <span>Role Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              disabled={mode === 'edit' && role?.is_system}
            />
          </label>
          <label className="role-form__field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <section>
            <h3>Select Permissions</h3>
            <div className="permission-grid">
              {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                <div key={resource} className="permission-group">
                  <h4>{resource}</h4>
                  {permissions.map((permission) => (
                    <label key={permission.id} className="permission-item">
                      <input
                        type="checkbox"
                        checked={form.permissionIds.includes(permission.name)}
                        onChange={() => togglePermission(permission.name)}
                      />
                      {permission.action}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </form>
        {error && <p className="role-form__error">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="role-form" loading={isSubmitting}>
          {mode === 'edit' ? 'Save Changes' : 'Create Role'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RoleFormModal;
