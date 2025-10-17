import apiClient, { setAuthToken } from './apiClient.js';

export const login = async ({ email, password, tenantId }) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
    tenantId
  });
  return response.data;
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
  setAuthToken(null);
};

export const refreshSession = async () => {
  const response = await apiClient.post('/auth/refresh');
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data.user;
};
