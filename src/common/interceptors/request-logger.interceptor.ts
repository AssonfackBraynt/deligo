import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { Observable, tap } from 'rxjs';
import { CORRELATION_ID_HEADER } from '../constants/app.constants';

const logger = pino({ name: 'deligo-api' });

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    const correlationId =
      request.header(CORRELATION_ID_HEADER) ?? randomUUID();

    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle().pipe(
      tap(() => {
        logger.info({
          correlationId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
          userAgent: request.header('user-agent'),
          ipAddress: request.ip,
        });
      }),
    );
  }
}
