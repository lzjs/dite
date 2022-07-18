import { lodash } from '@dite/utils';
import { Command, IOpts as ICommandOpts } from './command';
import { Hook, IOpts as IHookOpts } from './hook';
import { Service } from './service';

const resolveConfigModes = ['strict', 'loose'] as const;
export type ResolveConfigMode = typeof resolveConfigModes[number];

import assert from 'assert';
import { EnableBy, PluginType, ServiceStage } from '../types';
import { Plugin } from './plugin';
import { makeArray } from './utils';

export class PluginAPI {
  plugin: Plugin;
  service: Service;

  constructor(opts: { plugin: Plugin; service: Service }) {
    this.plugin = opts.plugin;
    this.service = opts.service;
  }

  register(opts: Omit<IHookOpts, 'plugin'>) {
    assert(
      this.service.stage <= ServiceStage.initPlugins,
      'api.register() should not be called after plugin register stage.',
    );
    this.service.hooks[opts.key] ||= [];
    this.service.hooks[opts.key].push(
      new Hook({ ...opts, plugin: this.plugin }),
    );
  }

  registerMethod(opts: { name: string; fn?: Function }) {
    assert(
      !this.service.pluginMethods[opts.name],
      `api.registerMethod() failed, method ${opts.name} is already exist.`,
    );
    this.service.pluginMethods[opts.name] = {
      plugin: this.plugin,
      fn:
        opts.fn ||
        // 这里不能用 arrow function，this 需指向执行此方法的 PluginAPI
        // 否则 pluginId 会不会，导致不能正确 skip plugin
        function (fn: Function | Object) {
          // @ts-ignore
          this.register({
            key: opts.name,
            ...(lodash.isPlainObject(fn) ? (fn as any) : { fn }),
          });
        },
    };
  }

  registerCommand(
    opts: Omit<ICommandOpts, 'plugin'> & { alias?: string | string[] },
  ) {
    const { alias } = opts;
    delete opts.alias;
    const registerCommand = (commandOpts: Omit<typeof opts, 'alias'>) => {
      const { name, configResolveMode } = commandOpts;

      assert(
        !configResolveMode ||
          resolveConfigModes.indexOf(configResolveMode) >= 0,
        `configResolveMode must be one of ${resolveConfigModes.join(
          ',',
        )}, but got ${configResolveMode}`,
      );
      assert(
        !this.service.commands[name],
        `api.registerCommand() failed, the command ${name} is exists from ${this.service.commands[name]?.plugin.id}.`,
      );
      this.service.commands[name] = new Command({
        ...commandOpts,
        plugin: this.plugin,
      });
    };
    registerCommand(opts);
    if (alias) {
      const aliases = makeArray(alias);
      aliases.forEach((alias) => {
        registerCommand({ ...opts, name: alias });
      });
    }
  }

  static proxyPluginAPI(opts: {
    pluginAPI: PluginAPI;
    service: Service;
    serviceProps: string[];
    staticProps: Record<string, any>;
  }) {
    return new Proxy(opts.pluginAPI, {
      get: (target, prop: string) => {
        if (opts.service.pluginMethods[prop]) {
          return opts.service.pluginMethods[prop].fn;
        }
        if (opts.serviceProps.includes(prop)) {
          // @ts-ignore
          const serviceProp = opts.service[prop];
          return typeof serviceProp === 'function'
            ? serviceProp.bind(opts.service)
            : serviceProp;
        }
        if (prop in opts.staticProps) {
          return opts.staticProps[prop];
        }
        // @ts-ignore
        return target[prop];
      },
    });
  }

  registerPresets(source: Plugin[], presets: any[]) {
    assert(
      this.service.stage === ServiceStage.initPresets,
      `api.registerPresets() failed, it should only used in presets.`,
    );
    source.splice(
      0,
      0,
      ...presets.map((preset) => {
        return new Plugin({
          path: preset,
          cwd: this.service.cwd,
          type: PluginType.preset,
        });
      }),
    );
  }

  registerPlugins(source: Plugin[], plugins: any[]) {
    assert(
      this.service.stage === ServiceStage.initPresets ||
        this.service.stage === ServiceStage.initPlugins,
      `api.registerPlugins() failed, it should only be used in registering stage.`,
    );
    const mappedPlugins = plugins.map((plugin) => {
      if (lodash.isPlainObject(plugin)) {
        assert(
          plugin.id && plugin.key,
          `Invalid plugin object, id and key must supplied.`,
        );
        plugin.type = PluginType.plugin;
        plugin.enableBy = plugin.enableBy || EnableBy.register;
        plugin.apply =
          plugin.apply ||
          (() => () => {
            //
          });
        plugin.config = plugin.config || {};
        plugin.time = { hooks: {} };
        return plugin;
      } else {
        return new Plugin({
          path: plugin,
          cwd: this.service.cwd,
          type: PluginType.plugin,
        });
      }
    });
    if (this.service.stage === ServiceStage.initPresets) {
      source.push(...mappedPlugins);
    } else {
      source.splice(0, 0, ...mappedPlugins);
    }
  }

  skipPlugins(keys: string[]) {
    keys.forEach((key) => {
      assert(!(this.plugin.key === key), `plugin ${key} can't skip itself!`);
      assert(
        this.service.keyToPluginMap[key],
        `key: ${key} is not be registered by any plugin. You can't skip it!`,
      );
      this.service.skipPluginIds.add(this.service.keyToPluginMap[key].id);
    });
  }
}

export { Plugin };
