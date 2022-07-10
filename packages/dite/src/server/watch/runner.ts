import spawn from '@dite/utils/compiled/cross-spawn';
import stringArgv from 'string-argv';
import killer from './killer';

function runCommand(fullCommand: any) {
  if (fullCommand) {
    const parts = stringArgv(fullCommand);
    const exec = parts[0];
    const args = parts.splice(1);
    return spawn(exec, args, {
      stdio: 'inherit',
    });
  }
}

export default function run(command: any) {
  const process = runCommand(command);
  const exitPromise = new Promise((resolve) => process?.on('exit', resolve));

  return function kill() {
    return Promise.all([killer(process), exitPromise]);
  };
}
