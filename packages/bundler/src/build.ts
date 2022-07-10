import { logger } from '@dite/utils';
import webpack from 'webpack';
import { getConfig } from './config/config';
import { Env } from './types';

interface IOpts {
  cwd: string;
  rootDir?: string;
  config: any;
  clean?: boolean;
  onBuildComplete?: Function;
  entry: Record<string, string>;
}

export async function build(opts: IOpts) {
  const webpackConfig = await getConfig({
    cwd: opts.cwd,
    rootDir: opts.rootDir,
    env: Env.production,
    entry: opts.entry,
    userConfig: opts.config,
    analyze: process.env.ANALYZE,
    // babelPreset: opts.babelPreset,
    extraBabelPlugins: [
      // ...(opts.beforeBabelPlugins || []),
      // ...(opts.extraBabelPlugins || []),
    ],
    extraBabelPresets: [
      // ...(opts.beforeBabelPresets || []),
      // ...(opts.extraBabelPresets || []),
    ],
    // extraBabelIncludes: opts.config.extraBabelIncludes,
    // chainWebpack: opts.chainWebpack,
    // modifyWebpackConfig: opts.modifyWebpackConfig,
    // cache: opts.cache,
  });

  let isFirstCompile = true;
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);
    const prefix = '[Webpack]';
    const PLUGIN_NAME = 'ProgressPlugin';
    compiler.hooks.invalid.tap(PLUGIN_NAME, () => {
      logger.wait(`${prefix} Compiling...`);
    });
    const now = Date.now();

    compiler.hooks.done.tap(PLUGIN_NAME, (stats: webpack.Stats) => {
      const { errors, warnings } = stats.toJson({
        all: false,
        warnings: true,
        errors: true,
        colors: true,
      });
      const hasErrors = !!errors?.length;
      if (hasErrors) {
        errors.forEach((error) => {
          logger.error(
            `${error.moduleName!}${error.loc ? `:${error.loc}` : ''}`,
          );
          console.log(error.message);
        });
      } else {
        logger.event(
          `${prefix} Compiled in ${stats.endTime - stats.startTime} ms (${
            stats.compilation.modules.size
          } modules)`,
        );
      }
    });
    compiler.run((err, stats) => {
      opts.onBuildComplete?.({
        err,
        stats,
        isFirstCompile,
        time: stats ? stats.endTime - stats.startTime : null,
      });
      isFirstCompile = false;
      if (err || stats?.hasErrors()) {
        if (err) {
          // console.error(err);
          reject(err);
        }
        if (stats) {
          const errorMsg = stats.toString('errors-only');
          // console.error(errorMsg);
          reject(new Error(errorMsg));
        }
      } else {
        console.log(`${prefix} Build complete in ${Date.now() - now} ms`);
        resolve(stats!);
      }
      compiler.close(() => {});
    });
  });
}
