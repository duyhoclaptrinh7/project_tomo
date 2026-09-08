import { Type } from '@google/genai';

export const chatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply_text: { type: Type.STRING },
    emotion_label: {
      anyOf: [
        { type: Type.STRING, enum: ['vui', 'buồn', 'stress', 'trung_lập'] },
        { type: Type.NULL },
      ],
    },
    should_speak: { type: Type.BOOLEAN },
    action: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: [
            'set_animation',
            'start_focus_session',
            'end_focus_session',
            'suggest_music',
            'propose_schedule',
            'none',
          ],
        },
        params: { type: Type.OBJECT },
      },
      required: ['type', 'params'],
    },
    new_facts: { type: Type.ARRAY, items: { type: Type.STRING } },
    point_event: {
      anyOf: [{ type: Type.STRING, enum: ['emotional_share'] }, { type: Type.NULL }],
    },
  },
  required: ['reply_text', 'emotion_label', 'should_speak', 'action', 'new_facts', 'point_event'],
};
