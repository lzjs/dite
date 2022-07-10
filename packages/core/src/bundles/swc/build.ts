import glob from '@dite/utils/compiled/fast-glob';
import { Config as SwcConfig, transformFile } from '@swc/core';
import path from 'path';
import { Env } from '../../types';

export function getBaseOpts(opts: { path: string; type?: 'es6' | 'commonjs' }) {
  const fileName = opts.path;
  const isTsFile = fileName.endsWith('.ts');
  const isTs = isTsFile || fileName.endsWith('.tsx');
  const isDev = process.env.NODE_ENV === Env.development;
  const config: SwcConfig = {
    module: {
      type: opts.type ?? 'commonjs',
      ignoreDynamic: true,
    },
    jsc: {
      parser: {
        syntax: isTs ? 'typescript' : 'ecmascript',
        [isTs ? 'tsx' : 'jsx']: !isTsFile,
        dynamicImport: isTs,
      },
      target: 'es2015',
      transform: {
        react: {
          runtime: 'automatic',
          pragma: 'React.createElement',
          pragmaFrag: 'React.Fragment',
          throwIfNamespace: true,
          development: isDev,
          useBuiltins: true,
        },
      },
    },
  };
  return config;
}

export async function swcTranspiler(
  sourceFilePath: string,
  buildFilePath: string,
) {
  try {
    const { code, map } = await transformFile(
      sourceFilePath,
      {
        ...getBaseOpts({
          type: 'commonjs',
          path: sourceFilePath,
        }),
      },
      // {
      // sourceMaps: true,
      // module: {
      //   type: 'commonjs',
      //   strict: true,
      // },
      // jsc: {
      //   target: 'es2019',
      //   parser: {
      //     syntax: 'typescript',
      //     tsx: true,
      //     decorators: true,
      //     dynamicImport: true,
      //   },
      //   transform: {
      //     legacyDecorator: true,
      //     decoratorMetadata: true,
      //   },
      // },
      // }
    );

    const dir = path.dirname(buildFilePath);
    // if (!fsExtra.existsSync(dir)) {
    //   await fsExtra.mkdir(path.dirname(buildFilePath), { recursive: true });
    // }
    console.log('dir', dir);
    console.log('buildFilePath', buildFilePath);
    // await fsExtra.writeFile(buildFilePath, code);
    // if (map) {
    //   await fsExtra.writeFile(buildFilePath + '.map', map);
    // }
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

  constructor(opts: BuilderOptions) {
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

export async function buildDir(dir: string) {
  const builder = new SwcBuilder({ dir });
  await builder.buildAll();
  return builder;
}
