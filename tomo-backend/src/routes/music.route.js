import { Router } from 'express';

import { handleMusicSuggest } from '../controllers/music.controller.js';

export const musicRouter = Router();

musicRouter.post('/', handleMusicSuggest);
