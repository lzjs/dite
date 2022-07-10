import 'zx/globals';
import { getPkgs } from '../utils';
(async () => {
  await $`pnpm i`;
  const ignore: string[] = [
    '*.log',
    '*.min.*',
    '**/dist/**',
    '**/node_modules/**',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
  ];
  const pkgs = getPkgs();
  console.log(pkgs);

  await Promise.all(
    pkgs.map(async (pkg) => {
      await $`cd packages/${pkg} && pnpm pkg-compile`;
      console.info(`+ ${pkg}`);
    }),
  );
})();
