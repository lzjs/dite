import { existsSync } from 'fs';
import { join } from 'path';
import 'zx/globals';
import { examplesDir } from '../internal/const';
import { getPkgs } from '../utils';
import { clean } from './clean';

function setDepsVersion(opts: {
  deps: string[];
  devDeps: string[];
  pkg: Record<string, any>;
  version: string;
}) {
  const { deps, devDeps, pkg, version } = opts;
  pkg.dependencies ||= {};
  deps.forEach((dep) => {
    if (pkg.dependencies[dep]) {
      pkg.dependencies[dep] = version;
    }
  });
  devDeps.forEach((dep) => {
    if (pkg?.devDependencies?.[dep]) {
      pkg.devDependencies[dep] = version;
    }
  });
  return pkg;
}

(async () => {
  const pkgs = getPkgs();
  $.verbose = false;
  const branch = await $`git rev-parse --abbrev-ref HEAD`;
  console.log('pnpm i');
  await $`pnpm i`;
  await clean();
  $.verbose = true;

  console.log('pnpm build');
  await $`pnpm build`;

  // console.log('pnpm build:deps');
  // await $`pnpm build:deps`;
  await $`lerna version --exact --no-commit-hooks --no-git-tag-version --no-push --loglevel error`;
  const version = require('../../lerna.json').version;

  console.info(`version: ${version}`);
  let tag = 'latest';
  if (
    version.includes('-alpha.') ||
    version.includes('-beta.') ||
    version.includes('-rc.')
  ) {
    tag = 'next';
  }
  if (version.includes('-canary.')) tag = 'canary';

  const examples = fs.readdirSync(examplesDir).filter((dir) => {
    return (
      !dir.startsWith('.') && existsSync(join(examplesDir, dir, 'package.json'))
    );
  });
  examples.forEach((example) => {
    const pkg = require(join(examplesDir, example, 'package.json'));
    // change deps version
    setDepsVersion({
      pkg,
      version,
      deps: [
        '@dite/cli',
        '@dite/core',
        '@dite/server',
        '@dite/utils',
        '@dite/logger',
        '@dite/bundler',
        '@dite/preset-dite',
        'create-dite',
        'dite',
      ],
      devDeps: [],
    });
    delete pkg.version;
    fs.writeFileSync(
      join(examplesDir, example, 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`,
    );
  });

  await $`pnpm i`;
  await $`git commit --all --message "chore(release): ${version}"`;

  // git tag
  if (tag !== 'canary') {
    await $`git tag v${version}`;
  }

  // git push
  await $`git push origin ${branch} --tags`;

  const innerPkgs = pkgs.filter(
    // do not publish
    (pkg) => !['env', 'react'].includes(pkg),
  );
  await Promise.all(
    innerPkgs.map((pkg) => $`cd packages/${pkg} && npm publish --tag ${tag}`),
  );
})();
