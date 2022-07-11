import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'start',
    description: 'Start',
    fn: async () => {
      //
    },
  });
};
