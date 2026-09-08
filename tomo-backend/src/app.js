import express from 'express';

import { createInvalidInputError } from './utils/appError.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { chatRouter } from './routes/chat.route.js';
import { musicRouter } from './routes/music.route.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '25mb' }));
  app.use('/chat', chatRouter);
  app.use('/music-suggest', musicRouter);
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      next(createInvalidInputError('Request body không phải JSON hợp lệ'));
      return;
    }
    next(error);
  });
  app.use(errorHandler);

  return app;
}
