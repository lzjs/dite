import { join } from 'path';

export const examplesDir = join(__dirname, '../../examples');

export const packagesDir = join(__dirname, '../../packages');

const ROOT = join(__dirname, '../../');

export const PATHS = {
  ROOT,
  PACKAGES: join(ROOT, './packages'),
  EXAMPLES: join(ROOT, './examples'),
  LERNA_CONFIG: join(ROOT, './lerna.json'),
  JEST_CONFIG: join(ROOT, './jest.config.ts'),
};
