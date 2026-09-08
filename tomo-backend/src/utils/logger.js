const LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

function write(level, message, meta) {
  const payload = {
    level: LEVELS[level],
    time: new Date().toISOString(),
    message,
  };

  if (meta && Object.keys(meta).length > 0) {
    payload.meta = meta;
  }

  const line = JSON.stringify(payload);
  /* eslint-disable no-console */
  if (level === 'error') {
    console.error(line);
    return;
  }
  console.log(line);
  /* eslint-enable no-console */
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
