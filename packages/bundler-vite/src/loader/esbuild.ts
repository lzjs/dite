import type { TransformOptions } from 'esbuild';
import {
  Loader as EsbuildLoader,
  transform as transformInternal,
} from 'esbuild';
import { extname } from 'path';
import type { LoaderContext } from 'webpack';
import type { ImportSpecifier } from '../../compiled/es-module-lexer';
import { init, parse } from '../../compiled/es-module-lexer';

export enum Mode {
  development = 'development',
  production = 'production',
}

export interface IEsbuildLoaderHandlerParams {
  code: string;
  filePath: string;
  imports: readonly ImportSpecifier[];
  exports: readonly string[];
}

export interface IEsbuildLoaderOpts extends Partial<TransformOptions> {
  handler?: Array<(opts: IEsbuildLoaderHandlerParams) => string>;
  implementation?: typeof import('esbuild');
}

async function esbuildTranspiler(
  this: LoaderContext<IEsbuildLoaderOpts>,
  source: string,
): Promise<void> {
  const done = this.async();
  const options: IEsbuildLoaderOpts = this.getOptions();
  const { handler = [], implementation, ...otherOptions } = options;
  const transform = implementation?.transform || transformInternal;

  const filePath = this.resourcePath;
  const ext = extname(filePath).slice(1) as EsbuildLoader;

  const transformOptions = {
    ...otherOptions,
    target: options.target ?? 'es2015',
    loader: ext ?? 'js',
    sourcemap: this.sourceMap,
    sourcefile: filePath,
  };

  try {
    let { code, map } = await transform(source, transformOptions);

    if (handler.length) {
      await init;
      handler.forEach((handle) => {
        const [imports, exports] = parse(code);
        code = handle({ code, imports, exports, filePath });
      });
    }

    done(null, code, map && JSON.parse(map));
  } catch (error: unknown) {
    done(error as Error);
  }
}

export default esbuildTranspiler;
export const esbuildLoader = __filename;
