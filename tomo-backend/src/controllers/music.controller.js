import { suggestMusic } from '../services/music.service.js';
import { musicRequestSchema } from '../schemas/musicRequest.schema.js';
import { createInvalidInputError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const handleMusicSuggest = asyncHandler(async (req, res) => {
  const parsed = musicRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createInvalidInputError(parsed.error.issues[0]?.message ?? 'Request không hợp lệ');
  }

  res.json(await suggestMusic(parsed.data));
});
