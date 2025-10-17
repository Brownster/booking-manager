import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUserPermissions } from '../services/rbacService.js';
import { useAuth } from './AuthContext.jsx';

const RBACContext = createContext(undefined);

const emptyContext = {
  roles: [],
  permissions: [],
  permissionSet: new Set(),
  isLoading: false
};

export const RBACProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const placeholder = {
    roles: [
      { id: 'role-admin', name: 'Admin', is_system: true },
      { id: 'role-provider', name: 'Provider', is_system: true }
    ],
    permissions: [
      'appointments:read',
      'appointments:create',
      'availability:read',
      'waitlist:read',
      'roles:read'
    ]
  };

  const { data, isLoading } = useQuery({
    queryKey: ['rbac', user?.tenantId, user?.id],
    queryFn: fetchCurrentUserPermissions,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: 0,
    select: (response) => ({
      roles: response.roles ?? [],
      permissions: response.permissions ?? [],
      cachedAt: response.cachedAt,
      expiresAt: response.expiresAt
    }),
    placeholderData: placeholder
  });

  const value = useMemo(() => {
    if (!isAuthenticated || !data) {
      return { ...emptyContext, isLoading };
    }

    return {
      roles: data.roles,
      permissions: data.permissions,
      permissionSet: new Set(data.permissions),
      cachedAt: data.cachedAt,
      expiresAt: data.expiresAt,
      isLoading
    };
  }, [data, isAuthenticated, isLoading]);

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
