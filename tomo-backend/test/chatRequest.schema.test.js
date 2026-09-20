import { describe, expect, it } from 'vitest';

import { chatRequestSchema } from '../src/schemas/chatRequest.schema.js';

const validRequest = () => ({
  input: { type: 'text', text: 'Chào Tomo' },
  memory_md: '',
  recent_history: [{ role: 'user', text: 'Xin chào', ts: '2026-09-08T10:00:00+07:00' }],
  session_context: {
    focus_session_active: false,
    evolution_stage: 1,
    evolution_points: 0,
  },
});

describe('chat request schema', () => {
  it('accepts a valid text request', () => {
    expect(chatRequestSchema.safeParse(validRequest()).success).toBe(true);
  });

  it('accepts valid audio and rejects missing audio data', () => {
    const validAudio = {
      ...validRequest(),
      input: { type: 'audio', audio_base64: 'QUJD', audio_mime: 'audio/mp4' },
    };
    expect(chatRequestSchema.safeParse(validAudio).success).toBe(true);

    const missingData = { ...validRequest(), input: { type: 'audio', audio_mime: 'audio/mp4' } };
    expect(chatRequestSchema.safeParse(missingData).success).toBe(false);
  });

  it.each(['', '   '])('rejects empty or whitespace-only text', (text) => {
    const request = validRequest();
    request.input.text = text;
    expect(chatRequestSchema.safeParse(request).success).toBe(false);
  });

  it('rejects more than twenty history messages', () => {
    const request = validRequest();
    request.recent_history = Array.from({ length: 21 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'tomo',
      text: `message ${index}`,
      ts: '2026-09-08T10:00:00Z',
    }));
    expect(chatRequestSchema.safeParse(request).success).toBe(false);
  });

  it('requires an ISO timestamp with timezone', () => {
    const request = validRequest();
    request.recent_history[0].ts = '2026-09-08T10:00:00';
    expect(chatRequestSchema.safeParse(request).success).toBe(false);
  });

  it('rejects fields outside the contract', () => {
    expect(chatRequestSchema.safeParse({ ...validRequest(), extra: true }).success).toBe(false);
  });
});
