import { winPath } from '@dite/utils';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { Env } from '../types';

function winJoin(...args: string[]) {
  return winPath(join(...args));
}

export function getPaths(opts: { cwd: string; prefix: string; env: Env }) {
  const cwd = opts.cwd;
  const src = winJoin(cwd, 'src');
  const absSrcPath = existsSync(src) && statSync(src).isDirectory() ? src : cwd;
  const absPagesPath = winJoin(absSrcPath, 'pages');
  const absApiRoutesPath = winJoin(absSrcPath, 'server');
  // const tmp =
  //   opts.env === Env.development
  //     ? `.${opts.prefix}`
  //     : `.${opts.prefix}-${opts.env}`;
  const tmp = `.${opts.prefix}`;
  const absTmpPath = winJoin(absSrcPath, tmp);
  const absNodeModulesPath = winJoin(cwd, 'node_modules');
  const absOutputPath = winJoin(cwd, 'dist');
  return {
    cwd,
    absSrcPath,
    absPagesPath,
    absApiRoutesPath,
    absTmpPath,
    absNodeModulesPath,
    absOutputPath,
  };
}

export type Paths = ReturnType<typeof getPaths>;
