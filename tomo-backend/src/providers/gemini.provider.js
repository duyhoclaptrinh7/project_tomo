import { GoogleGenAI } from '@google/genai';

import { config } from '../config/env.js';
import { chatResponseSchema } from '../prompts/responseSchema.js';
import { createGeminiError } from '../utils/appError.js';

let client;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return client;
}

async function withTimeout(promise, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), config.GEMINI_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Gọi Gemini với structured output cho luồng chat.
 * @param {string} systemInstruction - System prompt đã ghép context (memory, session).
 * @param {Array<object>} contents - Lịch sử hội thoại + tin nhắn mới.
 * @returns {Promise<object>} Kết quả JSON theo response schema.
 */
export async function generateChatResponse(systemInstruction, contents) {
  try {
    const response = await withTimeout(
      getClient().models.generateContent({
        model: config.GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: chatResponseSchema,
        },
      }),
      'Gemini timeout',
    );

    const text = response.text;
    if (!text) {
      throw new Error('Gemini không trả về nội dung');
    }

    return JSON.parse(text);
  } catch (error) {
    throw createGeminiError(error instanceof Error ? error.message : String(error));
  }
}

