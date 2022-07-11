import { prepare } from 'dite/dist/cli/prepare';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'generate',
    description: 'generate',
    fn: async function ({ args }) {
      await prepare();
      console.log('generate');
    },
  });
};
