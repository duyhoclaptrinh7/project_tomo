import { z } from 'zod';

export const musicRequestSchema = z
  .object({
    mood: z.string().trim().min(1, 'mood là bắt buộc'),
    genre_hint: z.string().default(''),
  })
  .strict();
