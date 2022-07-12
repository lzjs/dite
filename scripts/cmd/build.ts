import cpy from 'cpy';
import type { Plugin } from 'esbuild';
import { build } from 'esbuild';
import path from 'path';
import rimraf from 'rimraf';
import ts, { BuildOptions } from 'typescript';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import 'zx/globals';

export type Config = Partial<{
  outDir: string;
  clean?: boolean;
  tsConfigFile?: string;
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

const cwd = process.cwd();
const { argv } = yargs(hideBin(process.argv))
  .option('config', {
    describe: 'path to config file',
    type: 'string',
  })
  .option('clean', {
    describe: 'clean output directory before build',
    type: 'boolean',
  });

function getTSConfig(_tsConfigFile = 'tsconfig.json') {
  const tsConfigFile = ts.findConfigFile(cwd, ts.sys.fileExists, _tsConfigFile);
  if (!tsConfigFile) {
    throw new Error(`tsconfig.json not found in the current directory! ${cwd}`);
  }
  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd,
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

function getBuildMetadata(userConfig: Config) {
  const { tsConfig, tsConfigFile } = getTSConfig(userConfig.tsConfigFile);

  const outDir = userConfig.outDir || tsConfig.options.outDir || 'dist';

  const esbuildEntryPoints = userConfig.esbuild?.entryPoints || [];
  const srcFiles = [...tsConfig.fileNames, ...esbuildEntryPoints];
  const sourcemap = esBuildSourceMapOptions(tsConfig);
  const target =
    userConfig.esbuild?.target ||
    tsConfig?.raw?.compilerOptions?.target ||
    'es6';
  const minify = userConfig.esbuild?.minify || false;
  const plugins = userConfig.esbuild?.plugins || [];
  const format = userConfig.esbuild?.format || 'cjs';

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

  const assetPatterns = userConfig.assets?.filePatterns || ['**'];

  const assetsOptions = {
    baseDir: userConfig.assets?.baseDir || 'src',
    outDir: userConfig.assets?.outDir || outDir,
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
  const configFilename = <string>(await argv)?.config || 'etsc.config.js';
  const clean = <boolean>(await argv)?.clean || false;
  const config = {};

  const { outDir, esbuildOptions, assetsOptions } = getBuildMetadata(config);

  if (clean) {
    rimraf.sync(outDir);
  }

  await Promise.all([
    buildSourceFiles(esbuildOptions),
    copyNonSourceFiles(assetsOptions),
  ]);
})();
