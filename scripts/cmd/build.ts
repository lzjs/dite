import rimraf from '@dite/utils/compiled/rimraf';
import yArgs from '@dite/utils/compiled/yargs-parser';
import cpy from 'cpy';
import type { Plugin } from 'esbuild';
import { build } from 'esbuild';
import path from 'path';
import ts, { BuildOptions } from 'typescript';

type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type Config = Partial<{
  outDir: string;
  clean?: boolean;
  tsConfigFile?: string;
  cwd: string;
  esbuild: {
    entryPoints?: string[];
    minify?: boolean;
    target?: string;
    plugins?: Plugin[];
    format?: 'cjs' | 'esm';
  };
  assets: {
    baseDir?: string;
    outDir?: string;
    filePatterns?: string[];
  };
}>;

function getTSConfig(opts: { cwd: string; tsConfigFile?: string }) {
  const configPath = opts.tsConfigFile || 'tsconfig.json';
  const tsConfigFile = ts.findConfigFile(
    opts.cwd,
    ts.sys.fileExists,
    configPath,
  );
  if (!tsConfigFile) {
    throw new Error(
      `${tsConfigFile} not found in the current directory! ${opts.cwd}`,
    );
  }
  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    opts.cwd,
  );
  return { tsConfig, tsConfigFile };
}

type TSConfig = ReturnType<typeof getTSConfig>['tsConfig'];

function esBuildSourceMapOptions(tsConfig: TSConfig) {
  const { sourceMap, inlineSources, inlineSourceMap } = tsConfig.options;

  // inlineSources requires either inlineSourceMap or sourceMap
  if (inlineSources && !inlineSourceMap && !sourceMap) {
    return false;
  }

  // Mutually exclusive in tsconfig
  if (sourceMap && inlineSourceMap) {
    return false;
  }

  if (inlineSourceMap) {
    return 'inline';
  }

  return sourceMap;
}

function getBuildMetadata(config: PickRequired<Config, 'cwd'>) {
  const { tsConfig, tsConfigFile } = getTSConfig({
    cwd: config.cwd,
    tsConfigFile: config.tsConfigFile,
  });

  const outDir = config.outDir || tsConfig.options.outDir || 'dist';

  const esbuildEntryPoints = config.esbuild?.entryPoints || [];
  const srcFiles = [...tsConfig.fileNames, ...esbuildEntryPoints];
  const sourcemap = esBuildSourceMapOptions(tsConfig);
  const target =
    config.esbuild?.target || tsConfig?.raw?.compilerOptions?.target || 'es6';
  const minify = config.esbuild?.minify || false;
  const plugins = config.esbuild?.plugins || [];
  const format = config.esbuild?.format || 'cjs';

  const esbuildOptions: BuildOptions = {
    outdir: outDir,
    entryPoints: srcFiles,
    sourcemap,
    target,
    minify,
    plugins,
    tsconfig: tsConfigFile,
    format,
  };

  const assetPatterns = config.assets?.filePatterns || ['**'];

  const assetsOptions = {
    baseDir: config.assets?.baseDir || 'src',
    outDir: config.assets?.outDir || outDir,
    patterns: [...assetPatterns, `!**/*.{ts,js,tsx,jsx}`],
  };

  return { outDir, esbuildOptions, assetsOptions };
}

async function buildSourceFiles(esbuildOptions: Partial<BuildOptions>) {
  return await build({
    bundle: false,
    format: 'cjs',
    platform: 'node',
    ...esbuildOptions,
  });
}

type AssetsOptions = { baseDir: string; outDir: string; patterns: string[] };

function copyNonSourceFiles({ baseDir, outDir, patterns }: AssetsOptions) {
  const relativeOutDir = path.relative(baseDir, outDir);
  return cpy(patterns, relativeOutDir, {
    cwd: baseDir,
    parents: true,
  });
}

(async () => {
  const args = yArgs(process.argv.slice(2));
  const clean = args?.clean || false;
  const config = {
    cwd: process.cwd(),
  };

  const { outDir, esbuildOptions, assetsOptions } = getBuildMetadata(config);

  if (clean) {
    rimraf.sync(outDir);
  }

  await Promise.all([
    buildSourceFiles(esbuildOptions),
    copyNonSourceFiles(assetsOptions),
  ]);
})();
