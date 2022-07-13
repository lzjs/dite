import chalk from '@dite/utils/compiled/chalk';
import { dirname, isAbsolute } from 'path';
import Config from '../../compiled/webpack-5-chain';
import { Env, IConfig } from '../types';

interface IOpts {
  config: Config;
  userConfig: IConfig;
  cwd: string;
  env: Env;
  extraBabelPlugins: any[];
  extraBabelPresets: any[];
  extraBabelIncludes: string[];
  extraEsbuildLoaderHandler: any[];
  babelPreset: any;
  name?: string;
}

export async function addJavaScriptRules(opts: IOpts) {
  const { config, userConfig, cwd, name } = opts;

  const depPkgs = {};
  const srcRules = [
    config.module
      .rule('src')
      .test(/\.(js|mjs)$/)
      .include.add([
        cwd,
        // import module out of cwd using APP_ROOT
        ...(process.env.APP_ROOT ? [process.cwd()] : []),
      ])
      .end()
      .exclude.add(/node_modules/)
      .end(),
    config.module.rule('jsx-ts-tsx').test(/\.(jsx|ts|tsx)$/),
    config.module
      .rule('extra-src')
      .test(/\.(js|mjs)$/)
      .include.add([
        // support extraBabelIncludes
        ...opts.extraBabelIncludes.map((p) => {
          // handle absolute path
          if (isAbsolute(p)) {
            return p;
          }

          // resolve npm package name
          try {
            if (p.startsWith('./')) {
              return require.resolve(p, { paths: [cwd] });
            }

            return dirname(
              require.resolve(`${p}/package.json`, { paths: [cwd] }),
            );
          } catch (e: any) {
            if (e.code === 'MODULE_NOT_FOUND') {
              throw new Error('Cannot resolve extraBabelIncludes: ' + p);
            }

            throw e;
          }
        }),
        // support es5ImcompatibleVersions
        (path: string) => {
          try {
            // do src transform for bundler-webpack/client/client/client.js
            if (path.includes('client/client/client')) return true;
            // return isMatch({ path, pkgs: depPkgs });
            return false;
          } catch (e) {
            console.error(chalk.red(e));
            throw e;
          }
        },
      ])
      .end(),
  ] as Config.Rule<Config.Module>[];
  if (userConfig.mdx) {
    srcRules.push(config.module.rule('markdown').test(/\.mdx?$/));
  }
  const depRules = [
    config.module
      .rule('dep')
      .test(/\.(js|mjs)$/)
      .include.add(/node_modules/)
      .end()
      .exclude.add((path: string) => {
        try {
          // return isMatch({ path, pkgs: depPkgs });
          return true;
        } catch (e) {
          console.error(chalk.red(e));
          throw e;
        }
      })
      .end(),
  ];
  srcRules
    .concat(depRules)
    .forEach((rule) => rule.resolve.set('fullySpecified', false));

  // const prefix = existsSync(join(cwd, 'src')) ? join(cwd, 'src') : cwd;
  // const srcTranspiler = userConfig.srcTranspiler || Transpiler.babel;
  // srcRules.forEach((rule) => {
  // const AutoCSSModule = require('../swcPlugins/autoCSSModules').default;
  // rule.use('swc-loader').loader(require.resolve('../loader/swc'));
  // .options({
  //   plugin: (m: Program) => new AutoCSSModule().visitProgram(m),
  // });
  // });

  if (userConfig.mdx) {
    config.module
      .rule('mdx')
      .test(/\.mdx?$/)
      .use('mdx-loader')
      .loader(userConfig.mdx?.loader)
      .options(userConfig.mdx?.loaderOptions);
  }

  // const depTranspiler = userConfig.depTranspiler || Transpiler.none;
  // depRules.forEach((_rule) => {
  //   if (depTranspiler === Transpiler.none) {
  //     // noop
  //   } else {
  //     throw new Error(`Unsupported depTranspiler ${depTranspiler}.`);
  //   }
  // });
}
