import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export type ErrorDetail = {
  field?: string;
  message: string;
};

export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: ErrorDetail[],
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
      },
      status,
    );
  }
}
