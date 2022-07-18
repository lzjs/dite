import { RoutesResolver } from '@dite/core';
import path from 'path';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'routes',
    description: 'Routes',
    fn({ args }) {
      console.log(args);
      const router = new RoutesResolver({ cwd: path.join(api.cwd, 'app') });
      const routes = router.getRoutes(args.type);
      console.log(routes);
    },
  });
};
