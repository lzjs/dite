import { formatRoutes } from '@dite/core';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'routes',
    description: 'Routes',
    fn: async () => {
      const routes = formatRoutes({}, 'jsx');
      console.log(routes);
    },
  });
};
