import { path } from 'zx';

export interface RouteOptions {
  dir?: string;
}

export class Route {
  private readonly dir: string;
  private readonly routeDir: string;

  constructor(options: RouteOptions = {}) {
    this.dir = options.dir ?? './pages';
    this.routeDir = path.join(process.cwd(), this.dir);
  }
}
