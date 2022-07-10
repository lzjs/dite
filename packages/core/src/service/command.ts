import { yParser } from '@dite/utils';
import { Plugin } from './plugin';
import { ResolveConfigMode } from './pluginApi';

export interface IOpts {
  name: string;
  description?: string;
  options?: string;
  details?: string;
  fn: {
    ({ args }: { args: yParser.Arguments }): void;
  };
  plugin: Plugin;
  configResolveMode?: ResolveConfigMode;
}

export class Command {
  name: string;
  description?: string;
  options?: string;
  details?: string;
  configResolveMode: ResolveConfigMode;
  fn: {
    ({ args }: { args: yParser.Arguments }): void | Promise<void>;
  };
  plugin: Plugin;

  constructor(opts: IOpts) {
    this.name = opts.name;
    this.description = opts.description;
    this.options = opts.options;
    this.details = opts.details;
    this.fn = opts.fn;
    this.plugin = opts.plugin;
    this.configResolveMode = opts.configResolveMode || 'strict';
  }
}
