import { z } from 'zod';

const isoDateWithTimezone =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('none'),
    params: z.object({}).optional(),
  }),
  z.object({
    type: z.literal('set_animation'),
    params: z.object({
      animation_state: z.enum(['idle', 'happy', 'comfort', 'focused', 'speaking', 'celebrating']),
    }),
  }),
  z.object({
    type: z.literal('start_focus_session'),
    params: z.object({
      duration_minutes: z.number().finite().nullable(),
    }),
  }),
  z.object({
    type: z.literal('end_focus_session'),
    params: z.object({}).optional(),
  }),
  z.object({
    type: z.literal('suggest_music'),
    params: z.object({
      mood: z.string().trim().min(1),
    }),
  }),
  z.object({
    type: z.literal('propose_schedule'),
    params: z.object({
      title: z.string().trim().min(1),
      datetime_iso: z
        .string()
        .regex(isoDateWithTimezone, 'action.params.datetime_iso phải là ISO 8601 kèm timezone')
        .refine((value) => !Number.isNaN(Date.parse(value)), 'datetime_iso phải hợp lệ'),
      type: z.enum(['alarm', 'calendar_event']),
    }),
  }),
]);

export const chatResultSchema = z.object({
  reply_text: z.string().trim().min(1, 'reply_text không được rỗng'),
  emotion_label: z.enum(['vui', 'buồn', 'stress', 'trung_lập']).nullable(),
  should_speak: z.boolean(),
  action: actionSchema,
  new_facts: z.array(z.string().trim().min(1)),
  point_event: z.literal('emotional_share').nullable(),
});

/**
 * Chuẩn hoá kết quả Gemini về đúng Action object được client ký kết.
 * @param {object} result - Kết quả đã validate bằng Zod.
 * @returns {object} Response JSON cho `POST /chat`.
 */
export function toChatResponse(result) {
  return {
    ...result,
    action: {
      type: result.action.type,
      params: result.action.params ?? {},
    },
  };
}
