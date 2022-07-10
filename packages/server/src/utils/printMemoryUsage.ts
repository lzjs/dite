import { logger } from '@dite/utils';
import process from 'process';

export function getMemoryUsage() {
  const size = 1 << 20;
  const used = process.memoryUsage().heapUsed / size;
  const rss = process.memoryUsage().rss / size;
  return `Memory Usage: ${Math.round(used * 100) / 100} MB (RSS: ${
    Math.round(rss * 100) / 100
  } MB)`;
}

export function printMemoryUsage() {
  logger.info(getMemoryUsage());
}
