import yArgs from '@dite/utils/compiled/yargs-parser';
import { PATHS } from './internal/const';
import { spawnSync, toArray } from './utils';

function turbo(opts: {
  filter: string;
  cmd: string;
  extra?: string;
  cache?: boolean;
  parallel?: boolean;
}) {
  const extraCmd = opts.extra ? `-- ${opts.extra}` : '';
  const cacheCmd = opts.cache === false ? '--no-cache --force' : '';
  const parallelCmd = opts.parallel ? '--parallel' : '';
  const filters: string[] = toArray(opts.filter);

  const options = [
    opts.cmd,
    `--cache-dir=".turbo"`,
    filters.map((f) => `--filter="${f}"`).join(' '),
    cacheCmd,
    parallelCmd,
    extraCmd,
  ]
    .filter(Boolean)
    .join(' ');

  const command = `turbo run ${options}`;
  spawnSync(command, {
    cwd: PATHS.ROOT,
  });
}

async function main() {
  const args = yArgs(process.argv.slice(2));
  const filter = args.filter || './packages/*';
  const extra = (args._ || []).join(' ');

  turbo({
    cmd: args.cmd,
    filter,
    extra,
    cache: args.cache,
    parallel: args.parallel,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
