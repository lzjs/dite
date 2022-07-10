import { PATHS } from '../const';
import { spawnSync } from '../utils';

(async () => {
  spawnSync(`jest -c ${PATHS.JEST_CONFIG}`, { cwd: process.cwd() });
})();
