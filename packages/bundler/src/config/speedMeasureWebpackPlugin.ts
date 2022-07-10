import { join } from 'path';
import { Configuration } from 'webpack';
// @ts-ignore
import SpeedMeasurePlugin from '../../compiled/speed-measure-webpack-plugin';

interface IOpts {
  webpackConfig: Configuration;
}

export async function addSpeedMeasureWebpackPlugin(opts: IOpts) {
  let webpackConfig = opts.webpackConfig;
  if (process.env.SPEED_MEASURE) {
    const smpOption =
      process.env.SPEED_MEASURE === 'JSON'
        ? {
            outputFormat: 'json',
            outputTarget: join(process.cwd(), 'SPEED_MEASURE.log'),
          }
        : { outputFormat: 'human', outputTarget: console.log };
    webpackConfig = new SpeedMeasurePlugin(smpOption).wrap(webpackConfig);
  }
  return webpackConfig;
}
