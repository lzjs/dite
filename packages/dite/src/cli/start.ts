import { DiteCommand } from '../bin/dite';
import { printAndExit } from '../server/lib/utils';
import run from '../server/watch/runner';
import { prepare } from './prepare';

const diteStart: DiteCommand<{ port: number }> = async (flags) => {
  await prepare();
  if (flags.help) {
    printAndExit(
      `
    Description:
      Start the dite server.
    `,
      1,
    );
  } else {
    await run('node .dite/server/main.js');
  }
};

export default diteStart;
