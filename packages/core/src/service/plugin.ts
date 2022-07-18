import { fse, lodash, pkgUp, register, resolve, winPath } from '@dite/utils';
import assert from 'assert';
import esbuild from 'esbuild';
import path from 'path';
import { EnableBy, Env, IPluginConfig } from '../types';

const RE = {
  plugin: /^(@dite\/|dite-)plugin-/,
  preset: /^(@dite\/|dite-)preset-/,
};

type PluginType = 'plugin' | 'preset';

interface IOpts {
  path: string;
  cwd: string;
  type: PluginType;
}

export class Plugin {
  private readonly cwd: string;
  type: PluginType;
  path: string;
  id: string;
  key: string;
  apply: Function;
  config: IPluginConfig = {};
  time: {
    register?: number;
    hooks: Record<string, number[]>;
  } = { hooks: {} };
  enableBy:
    | EnableBy
    | ((opts: { userConfig: any; config: any; env: Env }) => boolean) =
    EnableBy.register;

  constructor(opts: IOpts) {
    this.type = opts.type;
    this.path = winPath(opts.path);
    this.cwd = opts.cwd;

    let pkg = null;
    // path is the package entry
    let isPkgEntry = false;
    const pkgJSONPath = pkgUp.pkgUpSync({ cwd: this.path })!;
    if (pkgJSONPath) {
      pkg = fse.readJSONSync(pkgJSONPath);
      isPkgEntry =
        winPath(
          path.join(path.dirname(pkgJSONPath), pkg.main || 'index.js'),
        ) === winPath(this.path);
    }
    this.id = this.getId({ pkg, isPkgEntry, pkgJSONPath });
    this.key = this.getKey({ pkg, isPkgEntry });
    this.apply = () => {
      register.register({
        implementor: esbuild,
        exts: ['.ts', '.mjs'],
      });
      register.clearFiles();
      let ret;
      try {
        ret = require(this.path);
      } catch (e: any) {
        throw new Error(
          `Register ${this.type} ${this.path} failed, since ${e.message}`,
        );
      } finally {
        register.restore();
      }
      // use the default member for es modules
      return ret.__esModule ? ret.default : ret;
    };
  }

  private getId(opts: {
    pkg: any;
    isPkgEntry: boolean;
    pkgJSONPath: string | null;
  }) {
    let id: string;
    if (opts.isPkgEntry) {
      id = opts.pkg!.name;
    } else if (winPath(this.path).startsWith(winPath(this.cwd))) {
      id = `./${winPath(path.relative(this.cwd, this.path))}`;
    } else if (opts.pkgJSONPath) {
      id = winPath(
        path.join(
          opts.pkg!.name,
          path.relative(path.dirname(opts.pkgJSONPath), this.path),
        ),
      );
    } else {
      id = winPath(this.path);
    }
    // id = id.replace('@dite/preset-dite/lib/plugins', '@@');
    id = id.replace(/\.js$/, '');
    return id;
  }

  getKey(opts: { pkg: any; isPkgEntry: boolean }) {
    // e.g.
    // initial-state -> initialState
    // webpack.css-loader -> webpack.cssLoader
    function nameToKey(name: string) {
      return name
        .split('.')
        .map((part) => lodash.camelCase(part))
        .join('.');
    }

    return nameToKey(
      opts.isPkgEntry
        ? Plugin.stripNoneDiteScope(opts.pkg.name).replace(RE[this.type], '')
        : path.basename(this.path, path.extname(this.path)),
    );
  }

  static isPluginOrPreset(type: 'plugin' | 'preset', name: string) {
    return RE[type].test(Plugin.stripNoneDiteScope(name));
  }

  static stripNoneDiteScope(name: string) {
    if (name.charAt(0) === '@' && !name.startsWith('@dite/')) {
      name = name.split('/')[1];
    }
    return name;
  }

  static getPluginsAndPresets(opts: {
    cwd: string;
    pkg: any;
    userConfig: any;
    plugins?: string[];
    presets?: string[];
    prefix: string;
  }) {
    function get(type: 'plugin' | 'preset') {
      const types = `${type}s` as 'plugins' | 'presets';
      return [
        // opts
        ...(opts[types] || []),
        // env
        ...(process.env[`${opts.prefix}_${types}`.toUpperCase()] || '')
          .split(',')
          .filter(Boolean),
        // dependencies
        // ...Object.keys(opts.pkg.devDependencies || {})
        //   .concat(Object.keys(opts.pkg.dependencies || {}))
        //   .filter(Plugin.isPluginOrPreset.bind(null, type)),
        // user config
        ...(opts.userConfig[types] || []),
      ].map((path) => {
        assert(
          typeof path === 'string',
          `Invalid plugin ${path}, it must be string.`,
        );
        let resolved;
        try {
          resolved = resolve.sync(path, {
            basedir: opts.cwd,
            extensions: ['.tsx', '.ts', '.mjs', '.jsx', '.js'],
          });
        } catch (_e) {
          throw new Error(`Invalid plugin ${path}, can not be resolved.`);
        }

        return new Plugin({
          path: resolved,
          type,
          cwd: opts.cwd,
        });
      });
    }

    return {
      presets: get('preset'),
      plugins: get('plugin'),
    };
  }
}
