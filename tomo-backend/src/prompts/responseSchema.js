import { Type } from '@google/genai';

const animationStates = ['idle', 'happy', 'comfort', 'focused', 'speaking', 'celebrating'];
const isoDateWithTimezone =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function actionVariant(type, params) {
  return {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: [type] },
      params,
    },
    required: ['type', 'params'],
  };
}

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
      anyOf: [
        actionVariant('none', { type: Type.OBJECT, properties: {} }),
        actionVariant('set_animation', {
          type: Type.OBJECT,
          properties: { animation_state: { type: Type.STRING, enum: animationStates } },
          required: ['animation_state'],
        }),
        actionVariant('start_focus_session', {
          type: Type.OBJECT,
          properties: {
            duration_minutes: { anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }] },
          },
          required: ['duration_minutes'],
        }),
        actionVariant('end_focus_session', { type: Type.OBJECT, properties: {} }),
        actionVariant('suggest_music', {
          type: Type.OBJECT,
          properties: { mood: { type: Type.STRING, minLength: 1 } },
          required: ['mood'],
        }),
        actionVariant('propose_schedule', {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, minLength: 1 },
            datetime_iso: { type: Type.STRING, pattern: isoDateWithTimezone.source },
            type: { type: Type.STRING, enum: ['alarm', 'calendar_event'] },
          },
          required: ['title', 'datetime_iso', 'type'],
        }),
      ],
    },
    new_facts: { type: Type.ARRAY, items: { type: Type.STRING } },
    point_event: {
      anyOf: [{ type: Type.STRING, enum: ['emotional_share'] }, { type: Type.NULL }],
    },
  },
  required: ['reply_text', 'emotion_label', 'should_speak', 'action', 'new_facts', 'point_event'],
};
