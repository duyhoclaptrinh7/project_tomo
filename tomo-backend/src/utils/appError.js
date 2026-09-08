class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function createInvalidInputError(message) {
  return new AppError(400, 'INVALID_INPUT', message);
}

export function createGeminiError(message = 'Gemini API gặp lỗi hoặc không phản hồi hợp lệ') {
  return new AppError(502, 'GEMINI_ERROR', message);
}

export function createInternalError(message = 'Lỗi nội bộ backend') {
  return new AppError(500, 'INTERNAL_ERROR', message);
}

export { AppError };
