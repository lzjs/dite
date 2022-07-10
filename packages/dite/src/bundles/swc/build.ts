import { Env } from '@dite/core';
import glob from '@dite/utils/compiled/fast-glob';
import fsExtra from '@dite/utils/compiled/fs-extra';
import { transformFile } from '@swc/core';
import path from 'path';

export async function swcTranspiler(
  sourceFilePath: string,
  buildFilePath: string,
) {
  try {
    const { code, map } = await transformFile(sourceFilePath, {
      sourceMaps: true,
      module: {
        type: 'commonjs',
        strict: true,
      },
      jsc: {
        target: 'es2019',
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    });

    const dir = path.dirname(buildFilePath);
    if (!fsExtra.existsSync(dir)) {
      await fsExtra.mkdir(path.dirname(buildFilePath), { recursive: true });
    }
    await fsExtra.writeFile(buildFilePath, code);
    if (map) {
      await fsExtra.writeFile(buildFilePath + '.map', map);
    }
  } catch (e) {
    console.error(e);
  }
}

const apiOutputPath = '.dite/server';

interface BuilderOptions {
  dir: string;
}

export class SwcBuilder {
  private readonly opts: BuilderOptions;
  protected readonly serverOutputPath: string;

  constructor(opts: { dir: string; env: Env }) {
    this.opts = opts;
    this.serverOutputPath = path.join(process.cwd(), apiOutputPath);
  }

  public async buildAll() {
    const files = glob.sync('**/*.+(js|jsx|ts|tsx)', {
      cwd: this.opts.dir,
      absolute: true,
    });

    await Promise.all(files.map(this.build.bind(this)));
  }

  public async build(file: string) {
    const filePath = path.relative(file, this.opts.dir);
    const buildFileName = path.basename(file, '.ts') + '.js';
    const buildFileFolder = path.dirname(filePath);
    const outputFile = path.join(
      this.serverOutputPath,
      buildFileFolder,
      buildFileName,
    );
    await swcTranspiler(file, outputFile);
  }
}

export async function buildDir(opts: { dir: string; env: Env }) {
  const builder = new SwcBuilder({ dir: opts.dir, env: opts.env });
  await builder.buildAll();
  return builder;
}
