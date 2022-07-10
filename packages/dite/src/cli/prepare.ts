import { formatRoutes } from '@dite/core';
import fs from '@dite/utils/compiled/fs-extra';
import path from 'path';

export async function prepare() {
  const distDir = path.join(process.cwd(), '.dite');
  await fs.mkdirp(distDir);
  await fs.mkdirp(path.join(process.cwd(), 'public'));
  const routes = formatRoutes({}, 'raw');
  await fs.writeJSON(path.join(distDir, 'routes.json'), routes);
}
