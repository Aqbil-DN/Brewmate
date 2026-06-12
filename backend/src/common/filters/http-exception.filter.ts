import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorCodes } from '../errors/app-error-codes.js';

/**
 * Global HTTP exception filter.
 *
 * Catches all exceptions (both HttpException and unexpected errors)
 * and returns a consistent JSON error envelope:
 *
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable message"
 *   }
 * }
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let code: string;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle validation pipe errors (class-validator)
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        code = (res['code'] as string) || this.mapHttpStatusToErrorCode(status);
        message = Array.isArray(res['message'])
          ? (res['message'] as string[]).join('; ')
          : (res['message'] as string) || exception.message;
      } else {
        code = this.mapHttpStatusToErrorCode(status);
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message;
      }
    } else {
      // Unexpected / unhandled error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = AppErrorCodes.INTERNAL_ERROR;
      message = 'An unexpected error occurred';

      // Log the full stack for debugging; never leak internals to client
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }

  private mapHttpStatusToErrorCode(status: number): string {
    const statusCodeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: AppErrorCodes.BAD_REQUEST,
      [HttpStatus.UNAUTHORIZED]: AppErrorCodes.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: AppErrorCodes.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: AppErrorCodes.NOT_FOUND,
      [HttpStatus.CONFLICT]: AppErrorCodes.CONFLICT,
      [HttpStatus.TOO_MANY_REQUESTS]: AppErrorCodes.TOO_MANY_REQUESTS,
      [HttpStatus.UNPROCESSABLE_ENTITY]: AppErrorCodes.VALIDATION_ERROR,
      [HttpStatus.INTERNAL_SERVER_ERROR]: AppErrorCodes.INTERNAL_ERROR,
    };

    return statusCodeMap[status] || AppErrorCodes.INTERNAL_ERROR;
  }
}
