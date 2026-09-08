import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  GEMINI_API_KEY: z.string().trim().min(1, 'GEMINI_API_KEY là bắt buộc'),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-3.6-flash'),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  GEMINI_MAX_OUTPUT_RETRIES: z.coerce.number().int().min(0).max(1).default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Cấu hình môi trường không hợp lệ:\n${issues.join('\n')}`);
}

export const config = Object.freeze({
  ...parsed.data,
  projectRoot,
});
