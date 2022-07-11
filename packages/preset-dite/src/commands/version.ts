import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'version',
    alias: 'v',
    description: 'show dite version',
    configResolveMode: 'loose',
    fn({ args }) {
      const version = require('../../package.json').version;
      if (!args.quiet) {
        console.log(`dite@${version}`);
      }
      return version;
    },
  });
};
