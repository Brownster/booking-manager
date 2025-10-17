import apiClient from './apiClient.js';

const fallbackPermissionCatalog = [
  {
    id: 'perm-appointments-create',
    name: 'appointments:create',
    resource: 'appointments',
    action: 'create'
  },
  {
    id: 'perm-appointments-read',
    name: 'appointments:read',
    resource: 'appointments',
    action: 'read'
  },
  {
    id: 'perm-availability-read',
    name: 'availability:read',
    resource: 'availability',
    action: 'read'
  },
  {
    id: 'perm-waitlist-read',
    name: 'waitlist:read',
    resource: 'waitlist',
    action: 'read'
  },
  {
    id: 'perm-roles-read',
    name: 'roles:read',
    resource: 'roles',
    action: 'read'
  },
  {
    id: 'perm-group-read',
    name: 'groupAppointments:read',
    resource: 'groupAppointments',
    action: 'read'
  },
  {
    id: 'perm-group-create',
    name: 'groupAppointments:create',
    resource: 'groupAppointments',
    action: 'create'
  },
  {
    id: 'perm-group-update',
    name: 'groupAppointments:update',
    resource: 'groupAppointments',
    action: 'update'
  },
  {
    id: 'perm-group-delete',
    name: 'groupAppointments:delete',
    resource: 'groupAppointments',
    action: 'delete'
  },
  {
    id: 'perm-metrics-read',
    name: 'metrics:read',
    resource: 'metrics',
    action: 'read'
  }
];

const fallbackRolesData = [
  {
    id: 'role-owner',
    name: 'Owner',
    is_system: true,
    permissionNames: [
      'appointments:create',
      'appointments:read',
      'roles:read',
      'groupAppointments:create',
      'groupAppointments:read',
      'groupAppointments:update',
      'groupAppointments:delete',
      'metrics:read'
    ]
  },
  {
    id: 'role-admin',
    name: 'Admin',
    is_system: true,
    permissionNames: [
      'appointments:create',
      'appointments:read',
      'roles:read',
      'availability:read',
      'groupAppointments:create',
      'groupAppointments:read',
      'groupAppointments:update',
      'metrics:read'
    ]
  },
  {
    id: 'role-provider',
    name: 'Provider',
    is_system: true,
    permissionNames: ['appointments:create', 'appointments:read', 'availability:read']
  }
];

const fallbackPermissions = {
  roles: fallbackRolesData,
  permissions: fallbackPermissionCatalog.map((permission) => permission.name)
};

export const fetchCurrentUserPermissions = async () => {
  try {
    const response = await apiClient.get('/rbac/me/permissions');
    return response.data;
  } catch (error) {
    console.warn('RBAC permission fetch failed, using fallback', error);
    return fallbackPermissions;
  }
};

export const fetchTenantRoles = async () => {
  try {
    const response = await apiClient.get('/rbac/roles');
    return response.data.roles;
  } catch (error) {
    console.warn('RBAC roles fetch failed, using fallback', error);
    return fallbackPermissions.roles;
  }
};

export const fetchPermissionsCatalog = async () => {
  try {
    const response = await apiClient.get('/rbac/permissions');
    return response.data.permissions;
  } catch (error) {
    console.warn('RBAC permission catalog fetch failed', error);
    return fallbackPermissions.permissions;
  }
};

export const fetchRoleDetails = async (roleId) => {
  if (!roleId) {
    return null;
  }
  try {
    const response = await apiClient.get(`/rbac/roles/${roleId}`);
    return response.data.role;
  } catch (error) {
    console.warn('RBAC role detail fetch failed', error);
    const fallback = fallbackRolesData.find((role) => role.id === roleId);
    return fallback
      ? {
          ...fallback,
          permissions: fallbackPermissionCatalog.filter((permission) =>
            fallback.permissionNames?.includes(permission.name)
          )
        }
      : null;
  }
};

export const createRole = async ({ name, description, permissionIds }) => {
  const response = await apiClient.post('/rbac/roles', {
    name,
    description,
    permissionIds
  });
  return response.data.role;
};

export const updateRole = async (roleId, payload) => {
  const response = await apiClient.put(`/rbac/roles/${roleId}`, payload);
  return response.data.role;
};

export const deleteRole = async (roleId) => {
  await apiClient.delete(`/rbac/roles/${roleId}`);
};

export const assignRoleToUser = async ({ userId, roleId, expiresAt }) => {
  const response = await apiClient.post(`/rbac/users/${userId}/roles`, {
    roleId,
    expiresAt
  });
  return response.data.roles;
};

export const removeRoleFromUser = async ({ userId, roleId }) => {
  const response = await apiClient.delete(`/rbac/users/${userId}/roles/${roleId}`);
  return response.data.roles;
};
