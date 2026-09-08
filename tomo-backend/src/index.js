import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

try {
  const app = createApp();

  app.listen(config.PORT, () => {
    logger.info(`Backend đang chạy trên cổng ${config.PORT}`, {
      env: config.NODE_ENV,
      model: config.GEMINI_MODEL,
    });
  });
} catch (error) {
  logger.error('Backend không khởi động được', {
    reason: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}
