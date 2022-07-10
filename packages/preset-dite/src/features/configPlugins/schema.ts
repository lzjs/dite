import type { Root } from '@dite/core/compiled/joi';

export function getSchemas(): Record<string, (Joi: Root) => any> {
  return {
    base: (Joi) => Joi.string(),
    port: (Joi) => Joi.number(),
    conventionRoutes: (Joi) =>
      Joi.object({
        base: Joi.string(),
        exclude: Joi.array().items(Joi.any()),
      }),
    headScripts: (Joi) => Joi.array(),
    history: (Joi) =>
      Joi.object({
        type: Joi.string().valid('browser', 'hash', 'memory'),
      }),
    links: (Joi) => Joi.array(),
    metas: (Joi) => Joi.array(),
    mountElementId: (Joi) => Joi.string(),
    plugins: (Joi) => Joi.array().items(Joi.string()),
    presets: (Joi) => Joi.array().items(Joi.string()),
    publicPath: (Joi) =>
      Joi.string().regex(/\/$/).error(new Error('publicPath must end with /')),
    routes: (Joi) => Joi.array().items(Joi.object()),
    scripts: (Joi) => Joi.array(),
    styles: (Joi) => Joi.array(),
    title: (Joi) => Joi.string(),
  };
}
