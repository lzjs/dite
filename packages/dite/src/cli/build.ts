import { Env } from '@dite/core';
import path from 'path';
import { DiteCommand } from '../bin/dite';
import { buildDir } from '../bundles/swc/build';
import { prepare } from './prepare';

const diteBuild: DiteCommand<{ analyze: boolean }> = async (flags) => {
  await prepare();
  await buildDir({ dir: path.join(process.cwd(), 'api'), env: Env.production });
};

export default diteBuild;
