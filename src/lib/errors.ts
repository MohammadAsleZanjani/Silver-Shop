export const ErrorCode = {
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_WEIGHT: "INVALID_WEIGHT",
  INSUFFICIENT_CASH_BALANCE: "INSUFFICIENT_CASH_BALANCE",
  INSUFFICIENT_SILVER_BALANCE: "INSUFFICIENT_SILVER_BALANCE",
  INSUFFICIENT_MARKET_SILVER: "INSUFFICIENT_MARKET_SILVER",
  PRICE_UNAVAILABLE: "PRICE_UNAVAILABLE",
  EXTERNAL_PRICE_UNAVAILABLE: "EXTERNAL_PRICE_UNAVAILABLE",
  TRANSACTION_NOT_FOUND: "TRANSACTION_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INVALID_IDEMPOTENCY_KEY: "INVALID_IDEMPOTENCY_KEY",
  DUPLICATE_REQUEST: "DUPLICATE_REQUEST",
  IDEMPOTENCY_KEY_REUSED: "IDEMPOTENCY_KEY_REUSED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
