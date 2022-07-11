import { formatRoutes } from '@dite/core';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'routes',
    description: 'Routes',
    fn() {
      const routes = formatRoutes({}, 'jsx');
      console.log(routes);
      return routes;
    },
  });
};
