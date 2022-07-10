import spawn from '@dite/utils/compiled/cross-spawn';
import stringArgv from 'string-argv';

function runCommand(
  fullCommand: any,
  opts: {
    env?: any;
    cwd?: string;
  } = {},
) {
  if (fullCommand) {
    const parts = stringArgv(fullCommand);
    const exec = parts[0];
    const args = parts.splice(1);
    return spawn(exec, args, {
      stdio: 'inherit',
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
    });
  }
}

export function run(
  command: any,
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
