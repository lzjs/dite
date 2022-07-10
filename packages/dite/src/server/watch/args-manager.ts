function removeRunnerArgs(args: any[]) {
  return args.splice(3);
}

function getCommandIdx(args: any[], command: string) {
  const lowerCasedCommand = command.toLowerCase();
  return args.map((arg) => arg.toLowerCase()).indexOf(lowerCasedCommand);
}

export function isCommandExist(args: any[], command: string) {
  return getCommandIdx(args, command) > 0;
}

export function hasWatchCommand(args: any[]) {
  return isCommandExist(args, '-w') || isCommandExist(args, '--watch');
}

function forceWatch(args: any[]) {
  if (!hasWatchCommand(args)) {
    args.push('--watch');
  }

  return args;
}

function extractCommandWithValue(args: any[], command: string) {
  let commandIdx = getCommandIdx(args, command);
  let commandValue = null;
  if (commandIdx > -1) {
    commandValue = args[commandIdx + 1];
    args.splice(commandIdx, 2);
  }
  return commandValue;
}

function extractCommand(args: any[], command: string) {
  let commandIdx = getCommandIdx(args, command);
  if (commandIdx > -1) {
    args.splice(commandIdx, 1);
    return true;
  }
  return false;
}

export function extractArgs(args: any[]) {
  const allArgs = forceWatch(removeRunnerArgs(args));

  const onFirstSuccessCommand = extractCommandWithValue(
    allArgs,
    '--onFirstSuccess',
  );
  const onSuccessCommand = extractCommandWithValue(allArgs, '--onSuccess');
  const onFailureCommand = extractCommandWithValue(allArgs, '--onFailure');
  const onCompilationStarted = extractCommandWithValue(
    allArgs,
    '--onCompilationStarted',
  );
  const onCompilationComplete = extractCommandWithValue(
    allArgs,
    '--onCompilationComplete',
  );
  const maxNodeMem = extractCommandWithValue(allArgs, '--maxNodeMem');
  const noColors = extractCommand(allArgs, '--noColors');
  const noClear = extractCommand(allArgs, '--noClear');
  const silent = extractCommand(allArgs, '--silent');
  let compiler = extractCommandWithValue(allArgs, '--compiler');
  if (!compiler) {
    compiler = 'typescript/bin/tsc';
  } else {
    compiler = require.resolve(compiler, { paths: [process.cwd()] });
  }

  return {
    onFirstSuccessCommand: onFirstSuccessCommand,
    onSuccessCommand: onSuccessCommand,
    onFailureCommand: onFailureCommand,
    onCompilationStarted: onCompilationStarted,
    onCompilationComplete: onCompilationComplete,
    maxNodeMem: maxNodeMem,
    noColors: noColors,
    noClear: noClear,
    silent: silent,
    compiler: compiler,
    args: allArgs,
  };
}
