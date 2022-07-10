import { Service as CoreService } from '@dite/core';
import fs from '@dite/utils/compiled/fs-extra';
import path from 'path';
import { configFiles } from '../constants';
import { getCwd } from './cwd';

export class Service extends CoreService {
  constructor(opts?: any) {
    process.env.DITE_DIR = path.dirname(require.resolve('../../package'));
    const cwd = getCwd();
    super({
      ...opts,
      env: process.env.NODE_ENV,
      cwd,
      defaultConfigFiles: configFiles,
      frameworkName: 'dite',
      presets: [require.resolve('@dite/preset-dite'), ...(opts?.presets || [])],
      plugins: [
        fs.existsSync(path.join(cwd, 'plugin.ts')) &&
          path.join(cwd, 'plugin.ts'),
        fs.existsSync(path.join(cwd, 'plugin.js')) &&
          path.join(cwd, 'plugin.js'),
      ].filter(Boolean),
    });
  }

  public runCommand(name: string, args?: any): Promise<void> {
    return this.run({
      ...args,
      name,
    });
  }
}
