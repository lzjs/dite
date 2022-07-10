import type { Config as SwcConfig } from '@swc/core';
import type { CommonOptions as EsbuildConfig } from 'esbuild';
import { Configuration } from 'webpack';
import Config from '../compiled/webpack-5-chain';

export enum Env {
  development = 'development',
  production = 'production',
}

type WebpackConfig = Required<Configuration>;

export interface IConfig {
  alias?: Record<string, string>;
  autoCSSModules?: boolean;
  base?: string;
  chainWebpack?: Function;
  // copy?: ICopy[] | string[];
  cssLoader?: { [key: string]: any };
  cssLoaderModules?: { [key: string]: any };
  // cssMinifier?: CSSMinifier;
  cssMinifierOptions?: { [key: string]: any };
  define?: { [key: string]: any };
  // depTranspiler?: Transpiler;
  devtool?: Config.DevTool;
  // deadCode?: DeadCodeParams;
  // https?: HttpsServerOptions;
  externals?: WebpackConfig['externals'];
  esm?: { [key: string]: any };
  // extraBabelPlugins?: IBabelPlugin[];
  // extraBabelPresets?: IBabelPlugin[];
  extraBabelIncludes?: string[];
  extraPostCSSPlugins?: any[];
  hash?: boolean;
  ignoreMomentLocale?: boolean;
  // jsMinifier?: JSMinifier;
  jsMinifierOptions?: { [key: string]: any };
  lessLoader?: { [key: string]: any };
  outputPath?: string;
  postcssLoader?: { [key: string]: any };
  // proxy?: { [key: string]: ProxyOptions };
  publicPath?: string;
  purgeCSS?: { [key: string]: any };
  sassLoader?: { [key: string]: any };
  // srcTranspiler?: Transpiler;
  styleLoader?: { [key: string]: any };
  svgr?: { [key: string]: any };
  svgo?: { [key: string]: any } | false;
  targets?: { [key: string]: any };
  writeToDisk?: boolean;

  [key: string]: any;
}

export interface SwcOptions extends SwcConfig {
  sync?: boolean;
  parseMap?: boolean;
}

export interface EsbuildOptions extends EsbuildConfig {
  sync?: boolean;
  parseMap?: boolean;
}
