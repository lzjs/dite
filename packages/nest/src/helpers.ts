import { compatRequire } from '@dite/utils';
import { INestApplication } from '@nestjs/common';
import path from 'path';
import type { CustomFactory } from '.';

export const API_DIR = '.dite/server';
export const NEST_APP_ENTRY_NAME = 'main';
export const CONFIG_FILE = '.dite/config.js';

export const getCustomApp = (
  pwd: string,
): Promise<INestApplication | CustomFactory | undefined> => {
  const entryPath = path.resolve(pwd, API_DIR, NEST_APP_ENTRY_NAME);

  return compatRequire(entryPath);
};

export const initMiddlewares = (middleware: any[]): any[] =>
  middleware.map((middlewareItem) =>
    typeof middlewareItem === 'string'
      ? compatRequire(middlewareItem)
      : middlewareItem,
  );

// const getInputFromRequest = async (request: Request): Promise<InputType> => {
//   const draft: Record<string, any> = {
//     params: request.params,
//     query: request.query,
//     headers: request.headers,
//     cookies: request.headers.cookie,
//   };
//
//   if (typeIs(request, ['application/json'])) {
//     draft.data = request.body;
//   } else if (typeIs(request, ['multipart/form-data'])) {
//     draft.formData = await resolveFormData(request);
//   } else if (typeIs(request, ['application/x-www-form-urlencoded'])) {
//     draft.formUrlencoded = request.body;
//   } else {
//     draft.body = request.body;
//   }
//
//   return draft as any;
// };

// const resolveFormData = (request: Request): Promise<Record<string, any>> => {
//   const form = formidable({ multiples: true });
//   return new Promise((resolve, reject) => {
//     form.parse(request, (err, fields, files) => {
//       if (err) {
//         reject(err);
//       }
//
//       resolve({
//         ...fields,
//         ...files,
//       });
//     });
//   });
// };
