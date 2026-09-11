import { File, Paths } from 'expo-file-system';

import { APP_STATE_FILE_NAME } from '../../constants/config.js';

export const DEFAULT_APP_STATE = Object.freeze({
  onboarded: false,
  evolutionPoints: 0,
  evolutionStage: 1,
  isOverlayEnabled: false,
  isFocusSessionActive: false,
});

function stateFile() {
  return new File(Paths.document, APP_STATE_FILE_NAME);
}

/**
 * Đọc app state với default an toàn khi file chưa có hoặc JSON bị hỏng.
 * @returns {Promise<object>}
 */
export async function readAppState() {
  const file = stateFile();
  if (!file.exists) {
    return { ...DEFAULT_APP_STATE };
  }

  try {
    return { ...DEFAULT_APP_STATE, ...JSON.parse(await file.text()) };
  } catch {
    return { ...DEFAULT_APP_STATE };
  }
}

/**
 * Persist app state bằng atomic replace để giảm rủi ro file hỏng khi app bị giết giữa chừng.
 * @param {object} state - Partial state cần cập nhật.
 * @returns {Promise<object>} State đã lưu.
 */
export async function writeAppState(state) {
  const current = await readAppState();
  const next = { ...current, ...state };
  const target = stateFile();
  try {
    await target.write(JSON.stringify(next, null, 2), { encoding: 'utf8' });
  } catch (err) {
    console.warn('Lỗi khi lưu app_state.json:', err);
  }
  return next;
}

export const appStateFileName = APP_STATE_FILE_NAME;
