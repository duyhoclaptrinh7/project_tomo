import { APP_STATE_FILE_NAME } from '../../constants/config.js';

/**
 * Skeleton app state service. Persistence hoàn thiện ở Phase 2/3.
 * @returns {Promise<object>} Trạng thái ứng dụng.
 */
export async function readAppState() {
  return { onboarded: false, isOverlayEnabled: false };
}

export const appStateFileName = APP_STATE_FILE_NAME;
