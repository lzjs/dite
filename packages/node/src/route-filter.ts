import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';

@Catch(NotFoundException)
export class RouteFilter implements ExceptionFilter {
  /**
   * Nest isn't aware of how next handles routing for the build assets, let next
   * handle routing for any request that isn't handled by a controller
   * @param err
   * @param host
   */
  public async catch(err: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    if (response && request) {
      console.log('111');
      // return;
    }

    // if the request and/or response are undefined (as with GraphQL) rethrow the error
    // return err;
    return request;
  }
}
