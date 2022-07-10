export interface RouteItemOptions {
  path: string;
  id: string;
  file: string;
  index: boolean;
}

export class RouteItem {
  protected path: string;
  protected id: string;
  protected file: string;
  protected index?: boolean;

  constructor(options: RouteItemOptions) {
    const { path, id, file, index } = options;
    this.path = path;
    this.id = id;
    this.file = file;
    this.index = index;
  }
}
