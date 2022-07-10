import { formatRoutes } from '@dite/core';
import { DiteCommand } from '../bin/dite';

const diteRoutes: DiteCommand<{ analyze: boolean | string }> = async () => {
  const routes = formatRoutes({}, 'jsx');
  console.log(routes);
};

export default diteRoutes;
