import glob from '@dite/utils/compiled/fast-glob';
import path from 'path';
import { transpiler } from './transpiler';

const apiOutputPath = '.dite/server';

interface BuilderOptions {
  dir: string;
}

export class SwcBuilder {
  private readonly opts: BuilderOptions;
  protected readonly serverOutputPath: string;

  constructor(opts: BuilderOptions) {
    this.opts = opts;
    this.serverOutputPath = path.join(process.cwd(), apiOutputPath);
  }

  public async buildAll() {
    const files = glob.sync('**/*.+(js|jsx|ts|tsx)', {
      cwd: this.opts.dir,
      absolute: true,
    });

    await Promise.all(files.map(this.build.bind(this)));
  }

  public async build(file: string) {
    const filePath = path.relative(file, this.opts.dir);
    const buildFileName = path.basename(file, '.ts') + '.js';
    const buildFileFolder = path.dirname(filePath);
    const outputFile = path.join(
      this.serverOutputPath,
      buildFileFolder,
      buildFileName,
    );
    await transpiler(file, outputFile);
  }
}

export async function buildDir(dir: string) {
  const builder = new SwcBuilder({ dir });
  await builder.buildAll();
  return builder;
}
