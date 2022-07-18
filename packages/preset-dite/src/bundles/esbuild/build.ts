import { Env } from '@dite/core';
import glob from '@dite/utils/compiled/fast-glob';
import fsExtra from '@dite/utils/compiled/fs-extra';
import esbuild from 'esbuild';
import path from 'path';

export async function transpiler(sourceFiles: string[], buildDir: string) {
  const tsconfig = path.join(process.cwd(), './tsconfig.json');
  await esbuild.build({
    sourcemap: true,
    platform: 'node',
    target: 'node14',
    bundle: false,
    // plugins: [await esbuildDecorators({ tsconfig })],
    entryPoints: [...sourceFiles],
    outdir: buildDir,
    incremental: true,
    format: 'cjs',
    tsconfig,
    // watch: {
    //   onRebuild(error) {
    //     if (error) logger.error('Compile api routes failed: ', error);
    //
    //     // Reload API route modules
    //     Object.keys(require.cache).forEach((modulePath) => {
    //       if (modulePath.startsWith(buildFilePath))
    //         delete require.cache[modulePath];
    //     });
    //   },
    // },
  });
}

const apiOutputPath = '.dite/server';

interface BuilderOptions {
  dir: string;
  env: Env;
  cwd: string;
}

export class Builder {
  private readonly opts: BuilderOptions;
  protected readonly serverOutputPath: string;

  constructor(opts: BuilderOptions) {
    this.opts = opts;
    this.serverOutputPath = path.join(this.opts.cwd, apiOutputPath);
  }

  public async buildAll() {
    const files = glob.sync('**/*.+(js|jsx|ts|tsx)', {
      cwd: this.opts.dir,
      absolute: true,
    });
    await this.build(files, { isFirstTime: true });
  }

  public async build(
    files: string[] | string,
    opts: { isFirstTime: boolean } = { isFirstTime: true },
  ) {
    const tsconfig = path.join(this.opts.dir, './tsconfig.json');
    const res = await esbuild.build({
      sourcemap: true,
      platform: 'node',
      target: 'node14',
      bundle: false,
      // plugins: [await esbuildDecorators({ tsconfig })],
      entryPoints: [...(Array.isArray(files) ? files : [files])],
      outdir: this.serverOutputPath,
      incremental: true,
      format: 'cjs',
      write: opts.isFirstTime,
      tsconfig,
    });
    if (res.outputFiles) {
      const files: string[] = [];
      res.outputFiles?.forEach((file) => {
        fsExtra.writeFileSync(file.path, file.contents);
        delete require.cache[file.path];
        files.push(file.path);
      });
      return files;
    }
    return [];
  }
}

export async function buildDir(opts: { dir: string; env: Env; cwd: string }) {
  const builder = new Builder({ dir: opts.dir, env: opts.env, cwd: opts.cwd });
  await builder.buildAll();
  return builder;
}
