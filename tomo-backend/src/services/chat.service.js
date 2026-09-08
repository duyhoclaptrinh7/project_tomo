import { generateChatResponse } from '../providers/gemini.provider.js';
import { buildSystemInstruction } from '../prompts/systemPrompt.js';

function buildUserContent(input) {
  if (input.type === 'text') {
    return { role: 'user', parts: [{ text: input.text }] };
  }

  return {
    role: 'user',
    parts: [
      {
        inlineData: {
          mimeType: input.audio_mime,
          data: input.audio_base64,
        },
      },
    ],
  };
}

/**
 * Ghép prompt và chuẩn hoá kết quả chat.
 * @param {object} payload - Request đã validate.
 * @returns {Promise<object>} Response đúng hợp đồng client.
 */
export async function processChat(payload) {
  const systemInstruction = buildSystemInstruction(
    payload.memory_md,
    payload.session_context,
  );

  const history = payload.recent_history.map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.text }],
  }));

  const contents = [...history, buildUserContent(payload.input)];

  const result = await generateChatResponse(systemInstruction, contents);

  return {
    reply_text: result.reply_text ?? '',
    emotion_label: result.emotion_label ?? null,
    should_speak: Boolean(result.should_speak),
    action: result.action?.type ? result.action : { type: 'none', params: {} },
    new_facts: Array.isArray(result.new_facts) ? result.new_facts : [],
    point_event: result.point_event ?? null,
  };
}

