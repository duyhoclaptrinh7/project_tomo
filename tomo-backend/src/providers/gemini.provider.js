import { GoogleGenAI } from '@google/genai';

import { config } from '../config/env.js';
import { chatResponseSchema } from '../prompts/responseSchema.js';
import { chatResultSchema } from '../schemas/chatResponse.schema.js';
import { createGeminiError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

let client;

export function setGeminiClient(nextClient) {
  const previous = client;
  client = nextClient;
  return () => {
    client = previous;
  };
}

function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return client;
}

class RetryableGeminiError extends Error {}

function isRetryableOutputError(error) {
  return error instanceof RetryableGeminiError;
}

function isNonRetryableGeminiError(error) {
  const status = Number(error?.status ?? error?.error?.status ?? error?.code);
  if ([401, 403, 429].includes(status)) return true;

  const message = String(error?.message ?? error);
  return /api key|authentication|permission|quota|resource_exhausted|billing/i.test(message);
}

async function callGeminiOnce(systemInstruction, contents, attempt) {
  const startedAt = performance.now();
  const abortController = new AbortController();
  let timeoutId;

  try {
    const request = getClient().models.generateContent({
      model: config.GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseJsonSchema: chatResponseSchema,
        abortSignal: abortController.signal,
      },
    });
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort();
        reject(new RetryableGeminiError('Gemini timeout'));
      }, config.GEMINI_TIMEOUT_MS);
    });

    const response = await Promise.race([request, timeout]);
    const text = response.text;
    if (!text) {
      throw new RetryableGeminiError('Gemini không trả về nội dung');
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new RetryableGeminiError('Gemini trả JSON không hợp lệ');
    }

    const result = chatResultSchema.safeParse(parsed);
    if (!result.success) {
      throw new RetryableGeminiError(
        `Gemini trả structured output không hợp lệ: ${result.error.issues[0]?.message ?? 'schema mismatch'}`,
      );
    }

    logger.info('Gemini request hoàn tất', {
      model: config.GEMINI_MODEL,
      attempt,
      durationMs: Math.round(performance.now() - startedAt),
      success: true,
    });
    return result.data;
  } catch (error) {
    logger.warn('Gemini request thất bại', {
      model: config.GEMINI_MODEL,
      attempt,
      durationMs: Math.round(performance.now() - startedAt),
      success: false,
      retryable: isRetryableOutputError(error) && !isNonRetryableGeminiError(error),
    });
    throw error;
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
  const maxAttempts = config.GEMINI_MAX_OUTPUT_RETRIES + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await callGeminiOnce(systemInstruction, contents, attempt);
    } catch (error) {
      const retryable = isRetryableOutputError(error) && !isNonRetryableGeminiError(error);
      if (!retryable || attempt === maxAttempts) {
        throw createGeminiError(isNonRetryableGeminiError(error) ? undefined : error.message);
      }
    }
  }

  throw createGeminiError();
}
