import { logger, yParser } from '@dite/utils';
import { Service } from '../service';
import { dev } from './dev';

process.on('unhandledRejection', (err) =>
  logger.error('[unhandledRejection]', err),
);

process.on('uncaughtException', (err) =>
  logger.error('[uncaughtException]', err.message),
);

function onFatalError(err: unknown) {
  logger.error(err);
  process.exit(1);
}

export async function run() {
  console.log(Date.now());
  const args = yParser(process.argv.slice(2), {
    alias: {
      version: ['v'],
      help: ['h'],
    },
    boolean: ['version', 'debug'],
  });
  const command = args._[0];
  if (command === 'dev') {
    await dev();
  } else {
    try {
      await new Service()
        .runCommand(command as string, args)
        .catch(onFatalError);
    } catch (err) {
      onFatalError(err);
    }
  }
}
