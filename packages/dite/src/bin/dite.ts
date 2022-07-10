import { logger } from '@dite/utils';
import type { AnyFlags, TypedFlags } from 'meow';
import meow from 'meow';
import { Service } from '../service';
import { dev } from './dev';

const helpText = `
Usage
  $ dite build
  $ dite dev
  $ dite routes
Options
  --help, -h          Print this help message and exit
  --version, -v       Print the CLI version and exit
  --json              Print the routes as JSON (dite routes only)
  --sourcemap         Generate source maps (dite build only)
Examples
  $ dite build
  $ dite dev
  $ dite routes
`;

type CommandFlags = TypedFlags<AnyFlags>;

export type DiteCommand<T extends CommandFlags = CommandFlags> = (
  args: typeof cli.flags & T,
) => Promise<void>;

export const commands = {
  dev: () => Promise.resolve(require('../cli/dev').default),
  build: () => Promise.resolve(require('../cli/build').default),
  usage: () => Promise.resolve(require('../cli/usage').default),
  routes: () => Promise.resolve(require('../cli/routes').default),
  start: () => Promise.resolve(require('../cli/start').default),
  upgrade: () => Promise.resolve(require('../cli/upgrade').default),
  init: () => Promise.resolve(require('../cli/init').default),
};

export type Command = keyof typeof commands;

const cli = meow(helpText, {
  autoHelp: true,
  autoVersion: true,
  description: false,
  flags: {
    version: {
      type: 'boolean',
      alias: 'v',
    },
    json: {
      type: 'boolean',
    },
    help: {
      type: 'boolean',
      alias: 'h',
    },
    debug: {
      type: 'boolean',
    },
    noClean: {
      type: 'boolean',
      default: false,
    },
  },
});

if (cli.flags.version) {
  cli.showVersion();
}

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
  const command = cli.input[0] || 'usage';
  // if (!(command in commands)) {
  //   logger.error('Invalid command ' + command)
  //   await (
  //     await commands.usage()
  //   )(cli.flags)
  //   process.exit(1)
  // }
  if (command === 'dev') {
    dev();
  } else {
    try {
      // const cmd: DiteCommand = (await commands[
      //   command as Command
      // ]()) as DiteCommand
      await new Service()
        .runCommand(command as string, cli.flags)
        .catch(onFatalError);
      // await cmd(cli.flags).catch(onFatalError)
    } catch (err) {
      onFatalError(err);
    }
  }
}
