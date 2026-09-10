import { File, Paths } from 'expo-file-system';

import { MEMORY_FILE_NAME } from '../../constants/config.js';

const HEADER = '# Ký ức của Tomo\n\n';

/** Đường dẫn file memory trong thư mục riêng của app. */
function memoryFile() {
  return new File(Paths.document, MEMORY_FILE_NAME);
}

/**
 * Đọc toàn bộ nội dung memory. File chưa tồn tại được coi là memory rỗng.
 * @returns {Promise<string>} Nội dung markdown của memory.
 */
export async function readMemory() {
  const file = memoryFile();
  if (!file.exists) {
    return '';
  }
  return file.text();
}

/**
 * Ghi trực tiếp nội dung memory, dùng cho merge và các screen quản lý về sau.
 * @param {string} content - Nội dung markdown cần lưu.
 * @returns {Promise<void>}
 */
export async function writeMemory(content) {
  await memoryFile().write(String(content ?? ''), { encoding: 'utf8' });
}

/**
 * Trích xuất chủ đề/tiền tố của một fact để xử lý xung đột đơn giản (dạng <chủ đề>: <nội dung>).
 * @param {string} fact
 * @returns {string|null} Chủ đề chuẩn hoá viết thường hoặc null nếu không có tiền tố.
 */
function extractTopic(fact) {
  const match = fact.match(/^([^:：\-–—]+)[:：\-–—]\s*(.+)$/);
  if (match) {
    const topic = match[1].trim().toLowerCase();
    if (topic.length > 0 && topic.length <= 40) {
      return topic;
    }
  }
  return null;
}

/**
 * Append/merge các fact mới vào memory.
 * - Fact trùng nội dung sẽ bị bỏ qua (deduplicate).
 * - Fact xung đột đơn giản (cùng chủ đề) sẽ ghi đè bản mới nhất theo ARCHITECTURE.md mục 6.5.
 * @param {string[]} facts - Danh sách fact trả về từ response /chat.
 * @returns {Promise<string>} Nội dung memory sau khi merge.
 */
export async function appendFacts(facts) {
  const current = await readMemory();
  const normalized = (Array.isArray(facts) ? facts : [])
    .map((fact) => String(fact ?? '').trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return current;
  }

  const currentLines = current
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());

  const updatedFacts = [...currentLines];

  for (const fact of normalized) {
    const topic = extractTopic(fact);
    if (topic) {
      const existingIndex = updatedFacts.findIndex((f) => extractTopic(f) === topic);
      if (existingIndex !== -1) {
        // Ghi đè fact cũ có cùng chủ đề với phiên bản mới nhất.
        updatedFacts[existingIndex] = fact;
        continue;
      }
    }

    if (updatedFacts.includes(fact)) {
      continue;
    }

    updatedFacts.push(fact);
  }

  const isChanged =
    updatedFacts.length !== currentLines.length ||
    updatedFacts.some((f, i) => f !== currentLines[i]);

  if (!isChanged) {
    return current;
  }

  const listMarkdown = updatedFacts.map((fact) => `- ${fact}`).join('\n');
  const content = `${HEADER}${listMarkdown}\n`;
  await writeMemory(content);
  return content;
}

/** Xóa toàn bộ memory, giữ header tối thiểu. */
export async function clearMemory() {
  await writeMemory(HEADER);
  return HEADER;
}

export const memoryFileName = MEMORY_FILE_NAME;
