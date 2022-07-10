import { Env } from '@dite/core';
import { fsExtra } from '@dite/utils';
import { Config as SwcConfig, transformFile } from '@swc/core';
import path from 'path';

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

export async function transpiler(
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
