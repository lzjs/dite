import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'usage',
    description: 'Usage',
    fn: async () => {
      //
    },
  });
};
