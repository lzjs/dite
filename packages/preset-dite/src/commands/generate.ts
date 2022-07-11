import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'generate',
    description: 'generate',
    fn: async function ({ args }) {
      console.log('generate');
    },
  });
};
