import express from 'express';

import { errorHandler } from './middlewares/errorHandler.js';
import { chatRouter } from './routes/chat.route.js';
import { musicRouter } from './routes/music.route.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '25mb' }));
  app.use('/chat', chatRouter);
  app.use('/music-suggest', musicRouter);
  app.use(errorHandler);

  return app;
}
