import { PATHS } from './internal/const';
import { spawnSync } from './utils';

async function main() {
  spawnSync(`jest -c ${PATHS.JEST_CONFIG}`, { cwd: process.cwd() });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
