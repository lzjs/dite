import { logger } from '@dite/utils';
import { Router } from 'express';
import path from 'path';

interface IOpts {
  prefix?: string;
}

const defaultOptions: IOpts = {
  prefix: '',
};

export default function expressListRoutes(app: Router, opts?: IOpts) {
  const stacks = app.stack;
  const options = { ...defaultOptions, ...opts };
  const routes: Record<string, Record<string, boolean>> = {};
  if (stacks) {
    for (const stack of stacks) {
      if (stack.route) {
        for (const route of stack.route.stack) {
          const method = route.method ? route.method.toUpperCase() : null;
          if (!method) {
            continue;
          }
          const stackPath = path.resolve(
            [options.prefix, stack.routerPath, stack.route.path, route.path]
              .filter((s) => !!s)
              .join(''),
          );
          const routeMap = routes[stackPath] ?? {};
          if (routeMap[method]) {
            logger.error(`Duplicate route: ${stackPath} ${method}`);
          }
          routeMap[method] = true;
          routes[stack.route.path] = routeMap;
        }
      }
    }
  }
  return routes;
}
