import { describe, expect, it } from 'vitest';

import { chatResultSchema, toChatResponse } from '../src/schemas/chatResponse.schema.js';

const validResult = () => ({
  reply_text: 'Mình lắng nghe bạn đây',
  emotion_label: 'buồn',
  should_speak: false,
  action: { type: 'none' },
  new_facts: ['Vừa thi trượt'],
  point_event: 'emotional_share',
});

describe('Gemini chat result schema', () => {
  it('validates all six response fields and normalizes action params', () => {
    expect(toChatResponse(chatResultSchema.parse(validResult()))).toEqual({
      ...validResult(),
      action: { type: 'none', params: {} },
    });
  });

  it('rejects an animation action missing its required parameter', () => {
    const result = validResult();
    result.action = { type: 'set_animation', params: {} };
    expect(chatResultSchema.safeParse(result).success).toBe(false);
  });

  it('accepts a complete schedule proposal', () => {
    const result = validResult();
    result.action = {
      type: 'propose_schedule',
      params: {
        title: 'Ôn thi',
        datetime_iso: '2026-09-09T07:00:00+07:00',
        type: 'alarm',
      },
    };
    expect(chatResultSchema.safeParse(result).success).toBe(true);
  });
});
