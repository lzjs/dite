import { fsExtra as fs, resolve } from '@dite/utils';
import prettier from '@dite/utils/compiled/prettier';
import path, { dirname, join } from 'path';
import { IApi } from '../../types';
import { getSchemas as getExtraSchemas } from './schema';

function resolveProjectDep(opts: { pkg: any; cwd: string; dep: string }) {
  if (
    opts.pkg.dependencies?.[opts.dep] ||
    opts.pkg.devDependencies?.[opts.dep]
  ) {
    return dirname(
      resolve.sync(`${opts.dep}/package.json`, {
        basedir: opts.cwd,
      }),
    );
  }
}

export default (api: IApi) => {
  // const reactDOMPath =
  //   resolveProjectDep({
  //     pkg: api.pkg,
  //     cwd: api.cwd,
  //     dep: 'react-dom',
  //   }) || dirname(require.resolve('react-dom/package.json'));
  // const reactDOMVersion = require(join(reactDOMPath, 'package.json')).version;
  // const isLT18 = !reactDOMVersion.startsWith('18.');
  const configDefaults: Record<string, any> = {
    externals: {},
    port: 3001,
    autoCSSModules: true,
    publicPath: '/',
    mountElementId: 'root',
    base: '/',
    history: { type: 'browser' },
    svgr: {},
  };

  // const distDir = path.join(process.cwd(), '.dite');
  // await fs.mkdirp(distDir);
  // await fs.mkdirp(path.join(process.cwd(), 'public'));
  // const routes = formatRoutes({}, 'raw');
  // await fs.writeJSON(path.join(distDir, 'routes.json'), routes);
  // const bundleSchemas = api.config.vite
  //   ? getViteSchemas()
  //   : getWebpackSchemas();
  const extraSchemas = getExtraSchemas();
  const schemas = {
    // ...bundleSchemas,
    ...extraSchemas,
  };
  for (const key of Object.keys(schemas)) {
    const config: Record<string, any> = {
      schema: schemas[key] || ((Joi: any) => Joi.any()),
    };
    if (key in configDefaults) {
      config.default = configDefaults[key];
    }
    api.registerPlugins([
      {
        id: `virtual: config-${key}`,
        key: key,
        config,
      },
    ]);
  }

  api.onStart(async () => {
    const distDir = path.join(api.cwd, '.dite');
    await fs.mkdirp(distDir);
    await fs.mkdirp(path.join(api.cwd, 'public'));

    fs.writeFileSync(
      join(api.cwd, '.dite/config.js'),
      prettier.format(`module.exports = ${JSON.stringify(api.appData)}`, {
        parser: 'babel',
      }),
    );
  });

  // api.paths is ready after register
  api.modifyConfig(async (memo, args) => {
    // memo.alias = {
    //   ...memo.alias,
    //   '@': args.paths.absSrcPath,
    //   '@@': args.paths.absTmpPath,
    // };
    return memo;
  });
};
