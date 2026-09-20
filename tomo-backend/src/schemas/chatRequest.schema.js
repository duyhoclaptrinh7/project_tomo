import { z } from 'zod';

export const RECENT_HISTORY_LIMIT = 20;

const isoDateWithTimezone =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

const historyMessageSchema = z.object({
  role: z.enum(['user', 'tomo']),
  text: z.string(),
  ts: z
    .string()
    .regex(isoDateWithTimezone, 'ts phải là ISO 8601 kèm timezone')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'ts phải là thời điểm hợp lệ'),
});

export const chatRequestSchema = z
  .object({
    input: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('text'),
        text: z.string().trim().min(1, 'input.text là bắt buộc khi type là text'),
      }),
      z.object({
        type: z.literal('audio'),
        audio_base64: z.string().trim().min(1, 'input.audio_base64 là bắt buộc khi type là audio'),
        audio_mime: z.string().trim().min(1, 'input.audio_mime là bắt buộc khi type là audio'),
      }),
    ]),
    memory_md: z.string(),
    recent_history: z
      .array(historyMessageSchema)
      .max(RECENT_HISTORY_LIMIT, `recent_history tối đa ${RECENT_HISTORY_LIMIT} tin nhắn`),
    session_context: z.object({
      focus_session_active: z.boolean(),
      focus_reminders_enabled: z.boolean(),
      evolution_stage: z.number().int().positive(),
      evolution_points: z.number().int().nonnegative(),
      current_time_iso: z
        .string()
        .regex(isoDateWithTimezone, 'current_time_iso phải là ISO 8601 kèm timezone')
        .refine((value) => !Number.isNaN(Date.parse(value)), 'current_time_iso phải hợp lệ'),
      timezone: z.string().trim().min(1),
    }),
  })
  .strict();
