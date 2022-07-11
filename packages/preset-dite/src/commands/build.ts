import { Env } from '@dite/core';
import { prepare } from 'dite/dist/cli/prepare';
import path from 'path';
import { buildDir } from '../bundles/esbuild/build';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build app for production',
    fn: async function ({ args }) {
      await prepare();
      await buildDir({
        dir: path.join(process.cwd(), 'api'),
        env: Env.production,
      });
    },
  });
};
