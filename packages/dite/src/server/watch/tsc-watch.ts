// import { fork } from 'child_process';
import spawn from '@dite/utils/compiled/cross-spawn';
import nodeCleanup from 'node-cleanup';
import runner from './runner';
import {
  deleteClear,
  detectState,
  manipulate,
  print,
} from './stdout-manipulator';

const readline = require('readline');

export function run(compilerConfig: any) {
  let firstTime = true;
  let firstSuccessKiller: (() => any) | null = null;
  let successKiller: (() => any) | null = null;
  let failureKiller: (() => any) | null = null;
  let compilationStartedKiller: (() => any) | null = null;
  let compilationCompleteKiller: (() => any) | null = null;

  const {
    onFirstSuccessCommand,
    onSuccessCommand,
    onFailureCommand,
    onCompilationStarted,
    onCompilationComplete,
    maxNodeMem,
    noColors,
    noClear,
    silent,
    compiler,
    args,
  } = compilerConfig;

  function killProcesses(killAll: boolean) {
    return Promise.all([
      killAll && firstSuccessKiller ? firstSuccessKiller() : null,
      successKiller ? successKiller() : null,
      failureKiller ? failureKiller() : null,
      compilationStartedKiller ? compilationStartedKiller() : null,
      compilationCompleteKiller ? compilationCompleteKiller() : null,
    ]);
  }

  function runOnCompilationStarted() {
    if (onCompilationStarted) {
      compilationStartedKiller = runner(onCompilationStarted);
    }
  }

  function runOnCompilationComplete() {
    if (onCompilationComplete) {
      compilationCompleteKiller = runner(onCompilationComplete);
    }
  }

  function runOnFailureCommand() {
    if (onFailureCommand) {
      failureKiller = runner(onFailureCommand);
    }
  }

  function runOnFirstSuccessCommand() {
    if (onFirstSuccessCommand) {
      firstSuccessKiller = runner(onFirstSuccessCommand);
    }
  }

  function runOnSuccessCommand() {
    if (onSuccessCommand) {
      successKiller = runner(onSuccessCommand);
    }
  }

  function buildNodeParams(
    allArgs: any[],
    { maxNodeMem }: { maxNodeMem: any },
  ) {
    let tscBin;
    try {
      tscBin = require.resolve(compiler);
    } catch (e: any) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.error(e.message);
        process.exit(9);
      }
      throw e;
    }

    return [
      ...(maxNodeMem ? [`--max_old_space_size=${maxNodeMem}`] : []),
      tscBin,
      ...allArgs,
    ];
  }

  let compilationErrorSinceStart = false;
  const nodeParams = buildNodeParams(args, { maxNodeMem });
  let tscProcess = spawn('node', nodeParams);
  // const tscProcess = fork(require.resolve('./child'), [], {
  //   cwd: process.cwd(),
  //   env: {
  //     ...process.env,
  //   },
  // });
  tscProcess.on('message', (msg) => {
    console.log(msg);
  });
  const rl = readline.createInterface({
    input: tscProcess.stdout,
  } as any);

  rl.on('line', function (input: string) {
    if (noClear) {
      input = deleteClear(input);
    }

    const line = manipulate(input);
    if (!silent) {
      print(noColors, noClear, line);
    }
    const state = detectState(line);
    const compilationStarted = state.compilationStarted;
    const compilationError = state.compilationError;
    const compilationComplete = state.compilationComplete;

    compilationErrorSinceStart =
      (!compilationStarted && compilationErrorSinceStart) || compilationError;

    if (state.fileEmitted !== null) {
      Signal.emitFile(state.fileEmitted);
    }

    if (compilationStarted) {
      killProcesses(false).then(() => {
        runOnCompilationStarted();
        Signal.emitStarted();
      });
    }

    if (compilationComplete) {
      killProcesses(false).then(() => {
        runOnCompilationComplete();

        if (compilationErrorSinceStart) {
          Signal.emitFail();
          runOnFailureCommand();
        } else {
          if (firstTime) {
            firstTime = false;
            Signal.emitFirstSuccess();
            runOnFirstSuccessCommand();
          }

          Signal.emitSuccess();
          runOnSuccessCommand();
        }
      });
    }
  });

  if (typeof process.on === 'function') {
    process.on('message', (msg) => {
      let promise;
      let func;
      switch (msg) {
        case 'run-on-compilation-started-command':
          promise = compilationStartedKiller
            ? compilationStartedKiller()
            : Promise.resolve();
          func = runOnCompilationStarted;
          break;

        case 'run-on-compilation-complete-command':
          promise = compilationCompleteKiller
            ? compilationCompleteKiller()
            : Promise.resolve();
          func = runOnCompilationComplete;
          break;

        case 'run-on-first-success-command':
          promise = firstSuccessKiller
            ? firstSuccessKiller()
            : Promise.resolve();
          func = runOnFirstSuccessCommand;
          break;

        case 'run-on-failure-command':
          promise = failureKiller ? failureKiller() : Promise.resolve();
          func = runOnFailureCommand;
          break;

        case 'run-on-success-command':
          promise = successKiller ? successKiller() : Promise.resolve();
          func = runOnSuccessCommand;
          break;

        default:
          console.log('Unknown message', msg);
      }

      if (func) {
        promise.then(func);
      }
    });
  }

  const Signal = {
    // @ts-ignore
    send:
      typeof process.send === 'function'
        ? // @ts-ignore
          (...e: any[]) => process.send(...e)
        : () => {},
    emitStarted: () => Signal.send('started'),
    emitFirstSuccess: () => Signal.send('first_success'),
    emitSuccess: () => Signal.send('success'),
    emitFail: () => Signal.send('compile_errors'),
    emitFile: (path: any) => Signal.send(`file_emitted:${path}`),
  };

  nodeCleanup((_exitCode, signal) => {
    // @ts-ignore
    tscProcess.kill(signal);
    killProcesses(true).then(() => process.exit());
    // don't call cleanup handler again
    nodeCleanup.uninstall();
    return false;
  });
}
