import apiClient from './apiClient.js';

export const fetchDashboardMetrics = async (params) => {
  try {
    const response = await apiClient.get('/metrics/dashboard', { params });
    return response.data.metrics;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
