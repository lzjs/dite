import { PluginAPI } from './pluginApi';

export default (api: PluginAPI) => {
  [
    'onCheck',
    'onStart',
    'modifyAppData',
    'modifyConfig',
    'modifyDefaultConfig',
    'modifyPaths',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
