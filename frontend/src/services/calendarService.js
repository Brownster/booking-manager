import apiClient from './apiClient.js';

export const fetchCalendars = async () => {
  const response = await apiClient.get('/calendars');
  return response.data.calendars;
};
