import { z } from 'zod';

const historyMessageSchema = z.object({
  role: z.enum(['user', 'tomo']),
  text: z.string(),
  ts: z.string().min(1),
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
    recent_history: z.array(historyMessageSchema),
    session_context: z.object({
      focus_session_active: z.boolean(),
      evolution_stage: z.number().int().positive(),
      evolution_points: z.number().int().nonnegative(),
    }),
  })
  .strict();
