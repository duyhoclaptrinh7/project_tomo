import { File, Paths } from 'expo-file-system';

import { HISTORY_FILE_NAME, RECENT_HISTORY_LIMIT } from '../../constants/config.js';

function historyFile() {
  return new File(Paths.document, HISTORY_FILE_NAME);
}

/**
 * Đọc toàn bộ lịch sử JSONL. Dòng hỏng bị bỏ qua để một lần ghi lỗi không làm mất cả history.
 * @returns {Promise<Array<object>>}
 */
export async function readAllHistory() {
  const file = historyFile();
  if (!file.exists) {
    return [];
  }

  return (await file.text())
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((messages, line) => {
      try {
        messages.push(JSON.parse(line));
      } catch {
        // Bỏ qua dòng JSONL hỏng do tiến trình bị gián đoạn.
      }
      return messages;
    }, []);
}

/**
 * Append một HistoryMessage xuống cuối file. Lịch sử local được giữ vô hạn.
 * @param {{role: string, text: string, ts?: string}} message
 * @returns {Promise<void>}
 */
export async function appendHistoryMessage(message) {
  const record = {
    role: message.role,
    text: String(message.text ?? ''),
    ts: message.ts ?? new Date().toISOString(),
  };
  await historyFile().write(`${JSON.stringify(record)}\n`, { append: true, encoding: 'utf8' });
}

/**
 * Trả về N tin nhắn gần nhất để gửi lên backend; không cắt file history local.
 * @param {number} [limit]
 * @returns {Promise<Array<object>>}
 */
export async function readRecentHistory(limit = RECENT_HISTORY_LIMIT) {
  const messages = await readAllHistory();
  return messages.slice(-Math.max(0, Number(limit) || RECENT_HISTORY_LIMIT));
}

export const historyFileName = HISTORY_FILE_NAME;
