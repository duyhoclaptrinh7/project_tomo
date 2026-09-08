import { apiClient } from './apiClient.js';

/**
 * Gửi request chat tới backend. Logic ghép payload hoàn chỉnh ở Phase 2.
 * @param {object} payload - Request body theo API_SPEC mục 3.1.
 * @returns {Promise<object>} Response JSON.
 */
export async function sendChat(payload) {
  const response = await apiClient.post('/chat', payload);
  return response.data;
}
