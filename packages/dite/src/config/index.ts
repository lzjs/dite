import { register } from '@dite/utils';
import fs from '@dite/utils/compiled/fs-extra';
import lodash from '@dite/utils/compiled/lodash';
import esbuild from 'esbuild';
import { configFiles } from '../constants';
import { getAbsFiles } from './utils';

export interface IConfig {
  port: number;
  // dir: string
  // version: string
}

export function defineConfig(options: Partial<IConfig>): Partial<IConfig> {
  const config: IConfig = {
    port: 3001,
    // dir: '.',
    // version: '',
    ...options,
  };
  return config as IConfig;
}

function getUserConfig(configFiles: string[]) {
  let config = {};
  let files: string[] = [];

  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      register.register({
        implementor: esbuild,
      });
      register.clearFiles();
      config = lodash.merge(config, require(configFile).default);
      for (const file of register.getFiles()) {
        delete require.cache[file];
      }
      // includes the config File
      files.push(...register.getFiles());
      register.restore();
    } else {
      files.push(configFile);
    }
  }
  return {
    config: config as IConfig,
    files,
  };
}

export function loadConfig(): Promise<IConfig> {
  const { config, files } = getUserConfig(
    getAbsFiles({
      files: configFiles,
      cwd: process.cwd(),
    }),
  );
  return Promise.resolve(config);
}
