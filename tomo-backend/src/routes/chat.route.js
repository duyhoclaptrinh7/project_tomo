import { Router } from 'express';

import { handleChat } from '../controllers/chat.controller.js';

export const chatRouter = Router();

chatRouter.post('/', handleChat);
