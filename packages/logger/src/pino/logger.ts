import path from 'path';
import pino from 'pino';

const timeFn = pino.stdTimeFunctions.isoTime;
const procIndex = process.env.NODE_APP_INSTANCE ?? 0;

const logDir = './storage/logs/';

interface LoggerOptions {
  dir?: string;
}

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const stream = pino.destination({
    dest: path.join(logDir, './pino2.log'),
    mkdir: true,
    sync: false,
  });
  return pino(
    {
      timestamp: timeFn,
    },
    stream,
  );
}
