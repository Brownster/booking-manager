import apiClient from './apiClient.js';

export const fetchGroupAppointments = async (params) => {
  const response = await apiClient.get('/group-appointments', { params });
  return response.data.groupAppointments;
};

export const createGroupAppointment = async (payload) => {
  const response = await apiClient.post('/group-appointments', payload);
  return response.data.groupAppointment;
};

export const updateGroupAppointment = async (groupAppointmentId, payload) => {
  const response = await apiClient.put(`/group-appointments/${groupAppointmentId}`, payload);
  return response.data.groupAppointment;
};

export const cancelGroupAppointment = async (groupAppointmentId) => {
  const response = await apiClient.post(`/group-appointments/${groupAppointmentId}/cancel`);
  return response.data.groupAppointment;
};

export const respondAsProvider = async ({ groupAppointmentId, providerUserId, status }) => {
  const response = await apiClient.post(
    `/group-appointments/${groupAppointmentId}/providers/${providerUserId}/respond`,
    { status }
  );
  return response.data.groupAppointment;
};

export const respondAsParticipant = async ({ groupAppointmentId, participantUserId, status, metadata }) => {
  const response = await apiClient.post(
    `/group-appointments/${groupAppointmentId}/participants/${participantUserId}/respond`,
    { status, metadata }
  );
  return response.data.groupAppointment;
};
