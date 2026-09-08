import { logger } from '../utils/logger.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';
  const message =
    statusCode >= 500 ? 'Lỗi nội bộ backend' : error.message || 'Yêu cầu không hợp lệ';

  logger.error('Request thất bại', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
  });

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
