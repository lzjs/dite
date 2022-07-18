export interface RouteItemOptions {
  path: string;
  id: string;
  file: string;
  index: boolean;
}

export class RouteItem {
  public path: string;
  public id: string;
  public file: string;
  public index?: boolean;

  constructor(options: RouteItemOptions) {
    const { path, id, file, index } = options;
    this.path = path;
    this.id = id;
    this.file = file;
    this.index = index;
  }
}
