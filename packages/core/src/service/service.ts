import { fse, lodash, yParser } from '@dite/utils';
import assert from 'assert';
import { isAbsolute, join } from 'path';
import {
  AsyncSeriesWaterfallHook,
  SyncWaterfallHook,
} from '../../compiled/tapable';
import { Config } from '../config/config';
import {
  ApplyPluginsType,
  ConfigChangeType,
  EnableBy,
  Env,
  IEvent,
  IModify,
  PluginType,
  ServiceStage,
} from '../types';
import { Command } from './command';
import { Hook } from './hook';
import { getPaths } from './path';
import { Plugin, PluginAPI } from './pluginApi';

export function getPkg({ cwd }: { cwd: string }) {
  // get pkg from package.json
  let pkg: Record<string, string | Record<string, any>> = {};
  let pkgPath = '';
  try {
    const filePath = join(cwd, 'package.json');
    pkg = fse.readJSONSync(filePath);
    pkgPath = filePath;
  } catch (_e) {
    // APP_ROOT
    if (cwd !== process.cwd()) {
      try {
        const filePath = join(process.cwd(), 'package.json');
        pkg = fse.readJSONSync(filePath);
        pkgPath = filePath;
      } catch (_e) {
        console.error(_e);
      }
    }
  }
  return { pkg, pkgPath: pkgPath || join(cwd, 'package.json') };
}

interface IOpts {
  cwd: string;
  env: Env;
  plugins?: string[];
  presets?: string[];
  frameworkName?: string;
  defaultConfigFiles?: string[];
}

export class Service {
  name = '';
  cwd: string;
  config: Record<string, any> = {};
  appData: {
    deps?: Record<
      string,
      {
        version: string;
        matches: string[];
        subpaths: string[];
        external?: boolean;
      }
    >;
    [key: string]: any;
  } = {};
  args: yParser.Arguments = { _: [], $0: '' };
  pluginMethods: Record<string, { plugin: Plugin; fn: Function }> = {};
  pkgPath = '';
  commands: Record<string, Command> = {};
  pkg: {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    [key: string]: any;
  } = {};
  keyToPluginMap: Record<string, Plugin> = {};
  stage: ServiceStage = ServiceStage.uninitialized;
  configDefaults: Record<string, any> = {};
  configOnChanges: Record<string, any> = {};
  skipPluginIds: Set<string> = new Set<string>();
  env: Env;
  hooks: Record<string, Hook[]> = {};
  private opts: IOpts;
  plugins: Record<string, Plugin> = {};
  paths: {
    cwd?: string;
    absSrcPath?: string;
    absPagesPath?: string;
    absApiRoutesPath?: string;
    absTmpPath?: string;
    absNodeModulesPath?: string;
    absOutputPath?: string;
  } = {};
  configManager: Config | null = null;
  configSchemas: Record<string, any> = {};
  userConfig: Record<string, any> = {};

  constructor(opts: IOpts) {
    this.cwd = opts.cwd;
    this.env = opts.env;
    this.opts = opts;
    assert(
      fse.existsSync(this.cwd),
      `Invalid cwd ${this.cwd}, it's not found.`,
    );
  }

  isPluginEnable(hook: Hook | string) {
    let plugin: Plugin;
    if ((hook as Hook).plugin) {
      plugin = (hook as Hook).plugin;
    } else {
      plugin = this.keyToPluginMap[hook as string];
      if (!plugin) return false;
    }
    const { id, key, enableBy } = plugin;
    if (this.skipPluginIds.has(id)) return false;
    if (this.userConfig[key] === false) return false;
    if (this.config[key] === false) return false;
    if (enableBy === EnableBy.config) {
      // TODO: 提供单独的命令用于启用插件
      // this.userConfig 中如果存在，启用
      // this.config 好了之后如果存在，启用
      // this.config 在 modifyConfig 和 modifyDefaultConfig 之后才会 ready
      // 这意味着 modifyConfig 和 modifyDefaultConfig 只能判断 api.userConfig
      // 举个具体场景:
      //   - p1 enableBy config, p2 modifyDefaultConfig p1 = {}
      //   - p1 里 modifyConfig 和 modifyDefaultConfig 仅 userConfig 里有 p1 有效，其他 p2 开启时即有效
      //   - p2 里因为用了 modifyDefaultConfig，如果 p2 是 enableBy config，需要 userConfig 里配 p2，p2 和 p1 才有效
      return key in this.userConfig || (this.config && key in this.config);
    }
    if (typeof enableBy === 'function')
      return enableBy({
        userConfig: this.userConfig,
        config: this.config,
        env: this.env,
      });
    // EnableBy.register
    return true;
  }

  async initPreset(opts: {
    preset: Plugin;
    presets: Plugin[];
    plugins: Plugin[];
  }) {
    const { presets, plugins } = await this.initPlugin({
      plugin: opts.preset,
      presets: opts.presets,
      plugins: opts.plugins,
    });
    opts.presets.unshift(...(presets || []));
    opts.plugins.push(...(plugins || []));
  }

  async initPlugin(opts: {
    plugin: Plugin;
    presets?: Plugin[];
    plugins: Plugin[];
  }) {
    this.plugins[opts.plugin.id] = opts.plugin;
    // apply with PluginAPI
    const pluginAPI = new PluginAPI({
      plugin: opts.plugin,
      service: this,
    });
    pluginAPI.registerPresets = pluginAPI.registerPresets.bind(
      pluginAPI,
      opts.presets || [],
    );
    pluginAPI.registerPlugins = pluginAPI.registerPlugins.bind(
      pluginAPI,
      opts.plugins,
    );
    const proxyPluginAPI = PluginAPI.proxyPluginAPI({
      service: this,
      pluginAPI,
      serviceProps: [
        'appData',
        'applyPlugins',
        'args',
        'config',
        'cwd',
        'pkg',
        'pkgPath',
        'name',
        'paths',
        'userConfig',
        'env',
        'isPluginEnable',
      ],
      staticProps: {
        ServiceStage,
        ApplyPluginsType,
        ConfigChangeType,
        EnableBy,
        service: this,
      },
    });
    const ret = await opts.plugin.apply()(proxyPluginAPI);
    this.keyToPluginMap[opts.plugin.key] = opts.plugin;
    if (ret?.presets) {
      ret.presets = ret.presets.map(
        (preset: string) =>
          new Plugin({
            path: preset,
            type: PluginType.preset,
            cwd: this.cwd,
          }),
      );
    }
    if (ret?.plugins) {
      ret.plugins = ret.plugins.map(
        (plugin: string) =>
          new Plugin({
            path: plugin,
            type: PluginType.plugin,
            cwd: this.cwd,
          }),
      );
    }

    return (
      ret || {
        presets: [],
        plugins: [],
      }
    );
  }

  async run(opts: { name: string; args?: any }) {
    const { name, args = {} } = opts;
    args._ = args._ || [];
    // shift the command itself
    if (args._[0] === name) args._.shift();
    this.args = args;
    this.name = name;
    const { pkg, pkgPath } = getPkg({ cwd: this.cwd });
    this.pkg = pkg;
    this.pkgPath = pkgPath;

    const prefix = this.opts.frameworkName || 'dite';
    // get user config
    const configManager = new Config({
      cwd: this.cwd,
      env: this.env,
      defaultConfigFiles: this.opts.defaultConfigFiles,
      specifiedEnv: process.env[`${prefix}_ENV`.toUpperCase()],
    });
    this.configManager = configManager;
    this.userConfig = configManager.getUserConfig().config;
    // get paths
    const paths = getPaths({
      cwd: this.cwd,
      env: this.env,
      prefix: this.opts.frameworkName || 'dite',
    });
    // temporary paths for use by function generateFinalConfig.
    // the value of paths may be updated by plugins later
    this.paths = paths;

    // resolve initial presets and plugins
    const { plugins, presets = [] } = Plugin.getPluginsAndPresets({
      cwd: this.cwd,
      pkg,
      plugins: this.opts.plugins || [],
      presets: [require.resolve('./servicePlugin')].concat(
        this.opts.presets || [],
      ),
      userConfig: this.userConfig,
      prefix,
    });
    const presetPlugins: Plugin[] = [];
    while (presets.length) {
      const preset = presets.shift();
      if (preset) {
        await this.initPreset({
          preset,
          presets,
          plugins: presetPlugins,
        });
      }
    }
    plugins.unshift(...presetPlugins);

    this.stage = ServiceStage.initPlugins;
    while (plugins.length) {
      const plugin = plugins.shift();
      if (plugin) {
        await this.initPlugin({ plugin, plugins });
      }
    }
    const command = this.commands[name];
    assert(command, `Invalid command ${name}, it's not registered.`);

    // collect configSchemas and configDefaults
    for (const id of Object.keys(this.plugins)) {
      const { config, key } = this.plugins[id];
      if (config.schema) this.configSchemas[key] = config.schema;
      if (config.default !== undefined) {
        this.configDefaults[key] = config.default;
      }
      this.configOnChanges[key] = config.onChange || ConfigChangeType.reload;
    }
    this.stage = ServiceStage.resolveConfig;
    const { config, defaultConfig } = await this.resolveConfig();
    if (this.config.outputPath) {
      paths.absOutputPath = isAbsolute(this.config.outputPath)
        ? this.config.outputPath
        : join(this.cwd, this.config.outputPath);
    }
    this.paths = await this.applyPlugins({
      key: 'modifyPaths',
      initialValue: paths,
    });
    this.stage = ServiceStage.collectAppData;
    this.appData = await this.applyPlugins({
      key: 'modifyAppData',
      initialValue: {
        cwd: this.cwd,
        pkg,
        pkgPath,
        plugins,
        presets,
        name,
        args,
        userConfig: this.userConfig,
        mainConfigFile: configManager.mainConfigFile,
        config,
        defaultConfig: defaultConfig,
      },
    });
    // applyPlugin onCheck
    this.stage = ServiceStage.onCheck;
    await this.applyPlugins({
      key: 'onCheck',
    });
    // applyPlugin onStart
    this.stage = ServiceStage.onStart;
    await this.applyPlugins({
      key: 'onStart',
    });
    // run command
    this.stage = ServiceStage.runCommand;
    return command.fn({ args });
  }

  // overload, for apply event synchronously
  applyPlugins<T>(opts: {
    key: string;
    type?: ApplyPluginsType.event;
    initialValue?: any;
    args?: any;
    sync: true;
  }): typeof opts.initialValue | T;
  applyPlugins<T>(opts: {
    key: string;
    type?: ApplyPluginsType;
    initialValue?: any;
    args?: any;
  }): Promise<typeof opts.initialValue | T>;
  applyPlugins<T>(opts: {
    key: string;
    type?: ApplyPluginsType;
    initialValue?: any;
    args?: any;
    sync?: boolean;
  }): Promise<typeof opts.initialValue | T> | (typeof opts.initialValue | T) {
    const hooks = this.hooks[opts.key] || [];
    let type = opts.type;
    // guess type from key
    if (!type) {
      if (opts.key.startsWith('on')) {
        type = ApplyPluginsType.event;
      } else if (opts.key.startsWith('modify')) {
        type = ApplyPluginsType.modify;
      } else if (opts.key.startsWith('add')) {
        type = ApplyPluginsType.add;
      } else {
        throw new Error(
          `Invalid applyPlugins arguments, type must be supplied for key ${opts.key}.`,
        );
      }
    }
    switch (type) {
      case ApplyPluginsType.add: {
        assert(
          !('initialValue' in opts) || Array.isArray(opts.initialValue),
          `applyPlugins failed, opts.initialValue must be Array if opts.type is add.`,
        );
        const asyncHook = new AsyncSeriesWaterfallHook(['memo']);
        for (const hook of hooks) {
          if (!this.isPluginEnable(hook)) continue;
          asyncHook.tapPromise(
            {
              name: hook.plugin.key,
              stage: hook.stage || 0,
              before: hook.before,
            },
            async (memo: any) => {
              const dateStart = new Date();
              const items = await hook.fn(opts.args);
              hook.plugin.time.hooks[opts.key] ||= [];
              hook.plugin.time.hooks[opts.key].push(
                new Date().getTime() - dateStart.getTime(),
              );
              return memo.concat(items);
            },
          );
        }
        return asyncHook.promise(opts.initialValue || []) as Promise<T>;
      }
      case ApplyPluginsType.modify: {
        const tModify = new AsyncSeriesWaterfallHook(['memo']);
        for (const hook of hooks) {
          if (!this.isPluginEnable(hook)) continue;
          tModify.tapPromise(
            {
              name: hook.plugin.key,
              stage: hook.stage || 0,
              before: hook.before,
            },
            async (memo: any) => {
              const dateStart = new Date();
              const ret = await hook.fn(memo, opts.args);
              hook.plugin.time.hooks[opts.key] ||= [];
              hook.plugin.time.hooks[opts.key].push(
                new Date().getTime() - dateStart.getTime(),
              );
              return ret;
            },
          );
        }
        return tModify.promise(opts.initialValue) as Promise<T>;
      }
      case ApplyPluginsType.event: {
        if (opts.sync) {
          const tEvent = new SyncWaterfallHook(['_']);
          hooks.forEach((hook) => {
            if (this.isPluginEnable(hook)) {
              tEvent.tap(
                {
                  name: hook.plugin.key,
                  stage: hook.stage || 0,
                  before: hook.before,
                },
                () => {
                  const dateStart = new Date();
                  hook.fn(opts.args);
                  hook.plugin.time.hooks[opts.key] ||= [];
                  hook.plugin.time.hooks[opts.key].push(
                    new Date().getTime() - dateStart.getTime(),
                  );
                },
              );
            }
          });

          return tEvent.call(1) as T;
        }

        const tEvent = new AsyncSeriesWaterfallHook(['_']);
        for (const hook of hooks) {
          if (!this.isPluginEnable(hook)) continue;
          tEvent.tapPromise(
            {
              name: hook.plugin.key,
              stage: hook.stage || 0,
              before: hook.before,
            },
            async () => {
              const dateStart = new Date();
              await hook.fn(opts.args);
              hook.plugin.time.hooks[opts.key] ||= [];
              hook.plugin.time.hooks[opts.key].push(
                new Date().getTime() - dateStart.getTime(),
              );
            },
          );
        }
        return tEvent.promise(1) as Promise<T>;
      }
      default:
        throw new Error(
          `applyPlugins failed, type is not defined or is not matched, got ${opts.type}.`,
        );
    }
  }

  async resolveConfig() {
    // configManager and paths are not available until the init stage
    assert(
      this.stage > ServiceStage.init,
      `Can't generate final config before init stage`,
    );

    const resolveMode = this.commands[this.name].configResolveMode;
    const config = await this.applyPlugins({
      key: 'modifyConfig',
      // why clone deep?
      // user may change the config in modifyConfig
      // e.g. memo.alias = xxx
      initialValue: lodash.cloneDeep(
        resolveMode === 'strict'
          ? this.configManager!.getConfig({
              schemas: this.configSchemas,
            }).config
          : this.configManager!.getUserConfig().config,
      ),
      args: { paths: this.paths },
    });
    const defaultConfig = await this.applyPlugins({
      key: 'modifyDefaultConfig',
      initialValue: this.configDefaults,
    });
    this.config = lodash.merge(defaultConfig, config) as Record<string, any>;

    return { config, defaultConfig };
  }
}

export interface IServicePluginAPI {
  appData: typeof Service.prototype.appData;
  applyPlugins: typeof Service.prototype.applyPlugins;
  args: typeof Service.prototype.args;
  config: typeof Service.prototype.config;
  cwd: typeof Service.prototype.cwd;
  // generators: typeof Service.prototype.generators;
  pkg: typeof Service.prototype.pkg;
  pkgPath: typeof Service.prototype.pkgPath;
  name: typeof Service.prototype.name;
  paths: Required<typeof Service.prototype.paths>;
  userConfig: typeof Service.prototype.userConfig;
  env: typeof Service.prototype.env;
  isPluginEnable: typeof Service.prototype.isPluginEnable;

  onCheck: IEvent<null>;
  onStart: IEvent<null>;
  modifyAppData: IModify<typeof Service.prototype.appData, null>;
  modifyConfig: IModify<
    typeof Service.prototype.config,
    { paths: Record<string, string> }
  >;
  modifyDefaultConfig: IModify<typeof Service.prototype.config, null>;
  modifyPaths: IModify<typeof Service.prototype.paths, null>;

  ApplyPluginsType: typeof ApplyPluginsType;
  ConfigChangeType: typeof ConfigChangeType;
  EnableBy: typeof EnableBy;
  ServiceStage: typeof ServiceStage;

  registerPresets: (presets: any[]) => void;
  registerPlugins: (plugins: (Plugin | Record<string, any>)[]) => void;
}
