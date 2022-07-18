import { Env } from '@dite/core';
import path from 'path';
import { buildDir } from '../bundles/esbuild/build';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build app for production',
    fn: async function ({ args }) {
      await buildDir({
        dir: path.join(api.cwd, 'server'),
        cwd: api.cwd,
        env: Env.production,
      });
    },
  });
};
