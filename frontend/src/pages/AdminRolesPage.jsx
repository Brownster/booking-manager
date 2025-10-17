import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import RoleList from '../components/rbac/RoleList.jsx';
import RoleDetailsModal from '../components/rbac/RoleDetailsModal.jsx';
import AssignRoleModal from '../components/rbac/AssignRoleModal.jsx';
import RoleFormModal from '../components/rbac/RoleFormModal.jsx';
import DeleteRoleModal from '../components/rbac/DeleteRoleModal.jsx';
import useDisclosure from '../hooks/useDisclosure.js';
import {
  fetchTenantRoles,
  fetchPermissionsCatalog,
  fetchRoleDetails,
  createRole,
  updateRole,
  deleteRole
} from '../services/rbacService.js';
import './page-layout.css';
import '../components/rbac/rbac.css';

const fallbackRoles = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full system access, including billing and tenant configuration.',
    is_system: true,
    permissionNames: ['appointments:create', 'appointments:read', 'roles:read']
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Manage team, appointments, waitlist, and roles.',
    is_system: true,
    permissionNames: ['appointments:manage', 'waitlist:manage', 'roles:assign']
  },
  {
    id: 'role-provider',
    name: 'Provider',
    description: 'Manage own calendar, availability, and appointments.',
    is_system: true,
    permissionNames: ['appointments:create', 'appointments:read', 'availability:read']
  }
];

export const AdminRolesPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const detailsModal = useDisclosure(false);
  const assignModal = useDisclosure(false);
  const createModal = useDisclosure(false);
  const editModal = useDisclosure(false);
  const deleteModal = useDisclosure(false);
  const queryClient = useQueryClient();

  const { data: rolesData } = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: fetchTenantRoles,
    placeholderData: fallbackRoles
  });

  const { data: permissionsCatalog } = useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: fetchPermissionsCatalog,
    placeholderData: []
  });

  const { data: roleDetails } = useQuery({
    queryKey: ['rbac', 'role', selectedRole?.id],
    queryFn: () => fetchRoleDetails(selectedRole?.id),
    enabled: Boolean(selectedRole?.id) && (detailsModal.isOpen || editModal.isOpen),
    placeholderData: selectedRole
      ? {
          ...selectedRole,
          permissions: permissionsCatalog.filter((permission) =>
            selectedRole.permissionNames?.includes(permission.name)
          )
        }
      : undefined
  });

  const roles = useMemo(() => rolesData ?? fallbackRoles, [rolesData]);

  const resetFormState = () => {
    setFormError(null);
    setDeleteError(null);
  };

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries(['rbac', 'roles']);
      resetFormState();
      createModal.onClose();
    },
    onError: (error) => {
      setFormError(error.response?.data?.error?.message ?? 'Unable to create role. Please try again.');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, payload }) => updateRole(roleId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['rbac', 'roles']);
      if (variables?.roleId) {
        queryClient.invalidateQueries(['rbac', 'role', variables.roleId]);
      }
      resetFormState();
      setSelectedRole(null);
      editModal.onClose();
    },
    onError: (error) => {
      setFormError(error.response?.data?.error?.message ?? 'Unable to update role. Please try again.');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => deleteRole(roleId),
    onSuccess: (_, roleId) => {
      queryClient.invalidateQueries(['rbac', 'roles']);
      queryClient.invalidateQueries(['rbac', 'role', roleId]);
      resetFormState();
      setSelectedRole(null);
      deleteModal.onClose();
    },
    onError: (error) => {
      setDeleteError(error.response?.data?.error?.message ?? 'Unable to delete role. Please try again.');
    }
  });

  const handleCreate = () => {
    resetFormState();
    setSelectedRole(null);
    createModal.onOpen();
  };

  const handleView = (role) => {
    setSelectedRole(role);
    detailsModal.onOpen();
  };

  const handleEdit = (role) => {
    if (role?.is_system) {
      setSelectedRole(role);
      detailsModal.onOpen();
      return;
    }
    resetFormState();
    setSelectedRole(role);
    editModal.onOpen();
  };

  const handleAssign = (role) => {
    setSelectedRole(role);
    assignModal.onOpen();
  };

  const handleAssignSubmit = (user, role) => {
    console.info(`Assign role ${role.name} to ${user.name}`);
  };

  const handleDelete = (role) => {
    if (role?.is_system) {
      setSelectedRole(role);
      detailsModal.onOpen();
      return;
    }
    resetFormState();
    setSelectedRole(role);
    deleteModal.onOpen();
  };

  const ensurePermissionsSelected = (payload) => {
    if (!payload.permissionIds?.length) {
      setFormError('Select at least one permission for this role.');
      return false;
    }
    return true;
  };

  const handleCreateSubmit = (payload) => {
    if (!ensurePermissionsSelected(payload)) {
      return;
    }
    createRoleMutation.mutate(payload);
  };

  const handleEditSubmit = (payload) => {
    if (!selectedRole) {
      return;
    }
    if (!ensurePermissionsSelected(payload)) {
      return;
    }
    updateRoleMutation.mutate({
      roleId: selectedRole.id,
      payload
    });
  };

  const handleDeleteConfirm = (role) => {
    if (!role) {
      return;
    }
    deleteRoleMutation.mutate(role.id);
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Roles & Permissions</h1>
          <p className="page__subtitle">
            Configure role-based access control to keep your team aligned with security best practices.
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" disabled>
            Permission Catalog
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            Create Role
          </Button>
        </div>
      </header>

      <RoleList
        roles={roles}
        onView={handleView}
        onAssign={handleAssign}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RoleDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.onClose}
        role={roleDetails}
        permissionsCatalog={permissionsCatalog}
        selectedPermissionNames={roleDetails?.permissions?.map((permission) => permission.name) ?? []}
      />

      <AssignRoleModal
        isOpen={assignModal.isOpen}
        onClose={assignModal.onClose}
        role={selectedRole}
        onAssign={handleAssignSubmit}
      />

      <RoleFormModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        mode="create"
        permissionsCatalog={permissionsCatalog}
        onSubmit={handleCreateSubmit}
        isSubmitting={createRoleMutation.isLoading}
        error={formError}
      />

      <RoleFormModal
        isOpen={editModal.isOpen}
        onClose={() => {
          editModal.onClose();
          setSelectedRole(null);
        }}
        mode="edit"
        role={roleDetails}
        permissionsCatalog={permissionsCatalog}
        onSubmit={handleEditSubmit}
        isSubmitting={updateRoleMutation.isLoading}
        error={formError}
      />

      <DeleteRoleModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.onClose();
          setSelectedRole(null);
        }}
        role={selectedRole}
        onConfirm={handleDeleteConfirm}
        isSubmitting={deleteRoleMutation.isLoading}
        error={deleteError}
      />

      <footer className="page__footer-hint">
        <Badge variant="info">RBAC</Badge>
        <span>Manage tenant security by creating roles and assigning permissions.</span>
      </footer>
    </div>
  );
};

export default AdminRolesPage;
