import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/chat.service.js', () => ({
  processChat: vi.fn(),
}));

import request from 'supertest';

import { createApp } from '../src/app.js';
import { processChat } from '../src/services/chat.service.js';

const validBody = () => ({
  input: { type: 'text', text: 'Chào Tomo' },
  memory_md: '',
  recent_history: [],
  session_context: { focus_session_active: false, evolution_stage: 1, evolution_points: 0 },
});

describe('POST /chat HTTP contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all six fields for a valid request', async () => {
    processChat.mockResolvedValue({
      reply_text: 'Chào bạn',
      emotion_label: null,
      should_speak: false,
      action: { type: 'none', params: {} },
      new_facts: [],
      point_event: null,
    });

    const response = await request(createApp()).post('/chat').send(validBody());

    expect(response.status).toBe(200);
    expect(Object.keys(response.body).sort()).toEqual([
      'action',
      'emotion_label',
      'new_facts',
      'point_event',
      'reply_text',
      'should_speak',
    ]);
  });

  it('rejects invalid input without calling the service', async () => {
    const response = await request(createApp())
      .post('/chat')
      .send({ ...validBody(), input: { type: 'text' } });

    expect(processChat).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('accepts an audio request and returns the full response contract', async () => {
    processChat.mockResolvedValue({
      reply_text: 'Tớ nghe thấy bạn rồi.',
      emotion_label: null,
      should_speak: true,
      action: { type: 'none', params: {} },
      new_facts: [],
      point_event: null,
    });

    const response = await request(createApp())
      .post('/chat')
      .send({
        ...validBody(),
        input: { type: 'audio', audio_base64: 'QUJD', audio_mime: 'audio/mp4' },
      });

    expect(response.status).toBe(200);
    expect(response.body.should_speak).toBe(true);
    expect(processChat).toHaveBeenCalledOnce();
  });

  it('rejects audio input without audio_base64', async () => {
    const response = await request(createApp())
      .post('/chat')
      .send({ ...validBody(), input: { type: 'audio', audio_mime: 'audio/mp4' } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(processChat).not.toHaveBeenCalled();
  });

  it('maps malformed JSON to INVALID_INPUT', async () => {
    const response = await request(createApp())
      .post('/chat')
      .set('Content-Type', 'application/json')
      .send('{invalid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  it('maps Gemini failures to GEMINI_ERROR', async () => {
    processChat.mockRejectedValue(
      Object.assign(new Error('upstream'), { statusCode: 502, code: 'GEMINI_ERROR' }),
    );

    const response = await request(createApp()).post('/chat').send(validBody());

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('GEMINI_ERROR');
  });
});
