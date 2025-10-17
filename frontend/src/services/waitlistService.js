import apiClient from './apiClient.js';

const sampleWaitlistEntries = [
  {
    id: 'waitlist-1',
    clientUserId: 'client-1',
    clientName: 'Jessica Smith',
    providerUserId: 'provider-1',
    providerName: 'Sarah Johnson',
    priority: 'high',
    status: 'active',
    requestedStart: '2025-11-01T14:00:00Z',
    requestedEnd: '2025-11-01T17:00:00Z',
    autoPromote: true,
    notes: 'Prefers afternoon slots',
    position: 1
  },
  {
    id: 'waitlist-2',
    clientUserId: 'client-2',
    clientName: 'John Doe',
    providerUserId: 'provider-2',
    providerName: 'Mike Davis',
    priority: 'medium',
    status: 'promoted',
    requestedStart: '2025-10-28T16:00:00Z',
    requestedEnd: '2025-10-28T18:00:00Z',
    autoPromote: false,
    notes: 'Flexible on provider',
    position: 3
  }
];

export const fetchWaitlistEntries = async (filters) => {
  try {
    const response = await apiClient.get('/waitlist', { params: filters });
    return response.data.entries;
  } catch (error) {
    console.warn('Waitlist fetch failed, using fallback', error);
    return sampleWaitlistEntries;
  }
};

export const createWaitlistEntry = async (payload) => {
  try {
    const response = await apiClient.post('/waitlist', payload);
    return response.data.entry;
  } catch (error) {
    console.warn('Waitlist create failed', error);
    throw error;
  }
};

export const promoteWaitlistEntry = async (entryId) => {
  try {
    const response = await apiClient.post(`/waitlist/${entryId}/promote`);
    return response.data.entry;
  } catch (error) {
    console.warn('Waitlist promote failed', error);
    throw error;
  }
};

export const cancelWaitlistEntry = async (entryId, reason) => {
  try {
    const response = await apiClient.post(`/waitlist/${entryId}/cancel`, { reason });
    return response.data.entry;
  } catch (error) {
    console.warn('Waitlist cancel failed', error);
    throw error;
  }
};

export const deleteWaitlistEntry = async (entryId) => {
  try {
    await apiClient.delete(`/waitlist/${entryId}`);
  } catch (error) {
    console.warn('Waitlist delete failed', error);
    throw error;
  }
};
