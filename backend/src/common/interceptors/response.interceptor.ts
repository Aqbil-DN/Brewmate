import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard API success response envelope.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Global response interceptor.
 *
 * Wraps all successful controller responses in a consistent envelope:
 *
 * {
 *   "success": true,
 *   "data": <controller return value>
 * }
 *
 * Error responses are handled separately by GlobalHttpExceptionFilter.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
      })),
    );
  }
}
