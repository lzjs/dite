import { uniqueId } from '@dite/utils/compiled/lodash';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const { url, method, params = {}, query = {} } = request;
    const id = uniqueId('req-');

    this.logger.log(`[${id}] Before: ${method} ${url} with: \
params: ${JSON.stringify(params)}, with query: ${JSON.stringify(query)}`);
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `[${id}] After: ${method} ${url} took ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
