import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'init',
    description: 'init',
    fn: async () => {
      console.log('init');
    },
  });
};
