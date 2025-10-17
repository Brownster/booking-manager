import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  fetchCurrentUser
} from '../services/authService.js';
import { setAuthToken } from '../services/apiClient.js';

const AuthContext = createContext(undefined);

const ACCESS_TOKEN_STORAGE_KEY = 'calendar-booking.authToken';

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    status: user.status,
    emailVerified: user.email_verified,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

const readStoredAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return stored || null;
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [accessToken, setAccessToken] = useState(() => readStoredAccessToken());
  const [persistLogin, setPersistLogin] = useState(() => Boolean(readStoredAccessToken()));
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateAccessToken = useCallback(
    (token, { persist } = {}) => {
      const shouldPersist = persist ?? persistLogin;
      setAccessToken(token);
      setAuthToken(token);

      if (typeof window !== 'undefined') {
        if (token && shouldPersist) {
          window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
        } else {
          window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        }
      }

      if (persist !== undefined) {
        setPersistLogin(persist);
      }
    },
    [persistLogin]
  );

  useEffect(() => {
    let isMounted = true;

    if (isInitialized) {
      return;
    }

    const initializeSession = async () => {
      setIsLoading(true);
      try {
        if (accessToken) {
          setAuthToken(accessToken);
          const currentUser = await fetchCurrentUser();
          if (isMounted) {
            setUser(normalizeUser(currentUser));
            setAuthError(null);
          }
          return;
        }

        const { user: refreshedUser, tokens } = await refreshSession();
        if (!isMounted) {
          return;
        }

        if (tokens?.accessToken) {
          updateAccessToken(tokens.accessToken);
        }

        setUser(normalizeUser(refreshedUser));
        setAuthError(null);
      } catch (error) {
        if (isMounted) {
          updateAccessToken(null, { persist: false });
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isInitialized, updateAccessToken]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const login = useCallback(
    async ({ email, password, tenantId, rememberMe = false }) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const { user: authenticatedUser, tokens } = await loginRequest({
          email,
          password,
          tenantId
        });

        updateAccessToken(tokens?.accessToken ?? null, { persist: rememberMe });
        const normalizedUser = normalizeUser(authenticatedUser);
        setUser(normalizedUser);
        await queryClient.invalidateQueries();
        return normalizedUser;
      } catch (error) {
        const message =
          error.response?.data?.error?.message ?? 'Unable to sign in. Please check your credentials.';
        setAuthError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient, updateAccessToken]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: refreshedUser, tokens } = await refreshSession();
      if (tokens?.accessToken) {
        updateAccessToken(tokens.accessToken);
      }
      if (refreshedUser) {
        setUser(normalizeUser(refreshedUser));
      }
      setAuthError(null);
      return normalizeUser(refreshedUser);
    } catch (error) {
      updateAccessToken(null, { persist: false });
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateAccessToken]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await logoutRequest();
    } catch (error) {
      // Even if logout fails, clear local session
    } finally {
      updateAccessToken(null, { persist: false });
      setUser(null);
      queryClient.clear();
      setIsLoading(false);
    }
  }, [queryClient, updateAccessToken]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isInitialized,
      authError,
      login,
      logout,
      refresh,
      clearAuthError
    }),
    [user, isLoading, isInitialized, authError, login, logout, refresh, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
