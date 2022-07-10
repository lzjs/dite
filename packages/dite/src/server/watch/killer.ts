const psTree = require('ps-tree');
import spawn from '@dite/utils/compiled/cross-spawn';
import { ChildProcess, exec } from 'child_process';

let KILL_SIGNAL = '15'; // SIGTERM
let hasPS = true;

const isWindows = process.platform === 'win32';

// discover if the OS has `ps`, and therefore can use psTree
exec('ps', function (error: any) {
  if (error) {
    hasPS = false;
  }
});

export default function kill(child?: ChildProcess) {
  if (!child) return;
  return new Promise((resolve) => {
    if (isWindows) {
      exec('taskkill /pid ' + child.pid + ' /T /F', resolve);
    } else {
      if (hasPS) {
        psTree(child.pid, function (err: any, kids: any[]) {
          // @ts-ignore
          spawn(
            'kill',
            // @ts-ignore
            ['-' + KILL_SIGNAL, child.pid].concat(kids.map((p) => p.PID)),
          ).on('close', resolve);
        });
      } else {
        exec('kill -' + KILL_SIGNAL + ' ' + child.pid, resolve);
      }
    }
  });
}
