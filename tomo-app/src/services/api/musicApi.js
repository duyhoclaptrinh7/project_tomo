import { apiClient } from './apiClient.js';

/**
 * Gọi gợi ý nhạc sau khi người dùng xác nhận. Logic UI hoàn thiện ở Phase 6.
 * @param {object} payload - Request body theo API_SPEC mục 4.1.
 * @returns {Promise<object>} Response JSON.
 */
export async function suggestMusic(payload) {
  const response = await apiClient.post('/music-suggest', payload);
  return response.data;
}
