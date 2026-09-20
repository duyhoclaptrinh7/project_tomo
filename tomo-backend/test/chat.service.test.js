import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/providers/gemini.provider.js', () => ({
  generateChatResponse: vi.fn(),
}));

import { generateChatResponse } from '../src/providers/gemini.provider.js';
import { processChat } from '../src/services/chat.service.js';

describe('chat service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds context and maps history roles for Gemini', async () => {
    generateChatResponse.mockResolvedValue({
      reply_text: 'OK',
      emotion_label: null,
      should_speak: false,
      action: { type: 'none' },
      new_facts: [],
      point_event: null,
    });

    await processChat({
      input: { type: 'text', text: 'Tin mới' },
      memory_md: 'Thích mèo',
      recent_history: [
        { role: 'user', text: 'Tin cũ', ts: '2026-09-08T10:00:00Z' },
        { role: 'tomo', text: 'Phản hồi cũ', ts: '2026-09-08T10:00:01Z' },
      ],
      session_context: {
        focus_session_active: true,
        evolution_stage: 2,
        evolution_points: 10,
      },
    });

    const [systemInstruction, contents] = generateChatResponse.mock.calls[0];
    expect(systemInstruction).toContain('Thích mèo');
    expect(systemInstruction).toContain('stage 2');
    expect(systemInstruction).toContain('phiên focus mode');
    expect(contents.map((item) => item.role)).toEqual(['user', 'model', 'user']);
    expect(contents.at(-1).parts[0].text).toBe('Tin mới');
  });

  it('passes raw audio to Gemini and always enables TTS for voice input', async () => {
    generateChatResponse.mockResolvedValue({
      reply_text: 'Tớ đã nghe thấy bạn.',
      emotion_label: null,
      should_speak: false,
      action: { type: 'none' },
      new_facts: [],
      point_event: null,
    });

    const response = await processChat({
      input: { type: 'audio', audio_base64: 'QUJD', audio_mime: 'audio/mp4' },
      memory_md: '',
      recent_history: [],
      session_context: {
        focus_session_active: false,
        evolution_stage: 1,
        evolution_points: 0,
      },
    });

    const [, contents] = generateChatResponse.mock.calls[0];
    expect(contents.at(-1).parts[0].inlineData).toEqual({
      mimeType: 'audio/mp4',
      data: 'QUJD',
    });
    expect(response.should_speak).toBe(true);
  });
});
