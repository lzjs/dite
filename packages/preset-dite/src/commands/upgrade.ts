import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'upgrade',
    description: 'show dite version',
    fn({ args }) {
      console.log('upgrade');
    },
  });
};
