import type { Request, Response } from 'express';

export const getMiddleware =
  ({ handler }: any) =>
  async (request: Request, response: Response) => {
    // const input = await getInputFromRequest(request);
    // if (isSchemaHandler(handler)) {
    //   const result = await run({ request: request as any, response }, () =>
    //     handler(input),
    //   );
    //   if (result.type !== 'HandleSuccess') {
    //     if (result.type === 'InputValidationError') {
    //       response.status(400);
    //     } else {
    //       response.status(500);
    //     }
    //     response.json(result.message);
    //   } else {
    //     response.json(result.value);
    //   }
    // } else {
    //   const args = Object.values(input.params as any).concat(input);
    //   const body = await run({ request: request as any, response }, () =>
    //     handler(...args),
    //   );
    //   response.json(body);
    // }
    response.json({
      1111: '2222',
    });

    response.end();
  };
