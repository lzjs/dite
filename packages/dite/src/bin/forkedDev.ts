import { yParser } from '@dite/utils';
import { Service } from '../service';

(async () => {
  try {
    const args = yParser(process.argv.slice(2));
    const service = new Service();
    await service.runCommand('dev', args);
    // await startServer()
    // configWatcher()
    let closed = false;
    // kill(2) Ctrl-C
    process.once('SIGINT', () => onSignal('SIGINT'));
    // kill(3) Ctrl-\
    process.once('SIGQUIT', () => onSignal('SIGQUIT'));
    // kill(15) default
    process.once('SIGTERM', () => onSignal('SIGTERM'));

    function onSignal(signal: string) {
      if (closed) return;
      closed = true;
      // TODO: kill child process
      process.exit(0);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
