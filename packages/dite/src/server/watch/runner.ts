import spawn from '@dite/utils/compiled/cross-spawn';
import yArgs from '@dite/utils/compiled/yargs-parser';

function runCommand(
  fullCommand: string,
  opts: {
    env?: any;
    cwd?: string;
  } = {},
) {
  if (fullCommand) {
    const { _: parts } = yArgs(fullCommand);
    const exec = parts[0];
    const args = parts.slice(1);
    return spawn(String(exec), args as string[], {
      stdio: 'inherit',
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
    });
  }
}

export function run(
  command: string,
  opts: {
    env?: any;
    cwd?: string;
  } = {},
) {
  const childProcess = runCommand(command, opts);
  const exitPromise = new Promise((resolve) =>
    childProcess?.on('exit', resolve),
  );

  return () => {
    return Promise.all([childProcess?.kill('SIGINT'), exitPromise]);
  };
}
