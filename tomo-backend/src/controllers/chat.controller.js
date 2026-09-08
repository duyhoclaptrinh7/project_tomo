import { chatRequestSchema } from '../schemas/chatRequest.schema.js';
import { processChat } from '../services/chat.service.js';
import { createInvalidInputError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const handleChat = asyncHandler(async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createInvalidInputError(parsed.error.issues[0]?.message ?? 'Request không hợp lệ');
  }

  res.json(await processChat(parsed.data));
});
