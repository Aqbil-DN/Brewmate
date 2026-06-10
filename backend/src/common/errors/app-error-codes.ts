/**
 * Application-wide error codes.
 *
 * Convention: <DOMAIN>_<ERROR_NAME>
 * These codes are returned in the API error response body so that
 * the mobile client can react to specific failure types without
 * parsing human-readable messages.
 */
export const AppErrorCodes = {
  // ── General ──────────────────────────────────────────────
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // ── Auth ─────────────────────────────────────────────────
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_PHONE_ALREADY_EXISTS: 'AUTH_PHONE_ALREADY_EXISTS',
  AUTH_ACCOUNT_INACTIVE: 'AUTH_ACCOUNT_INACTIVE',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',

  // ── User ─────────────────────────────────────────────────
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // ── Product ──────────────────────────────────────────────
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',

  // ── Cart ─────────────────────────────────────────────────
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  CART_EMPTY: 'CART_EMPTY',

  // ── Order ────────────────────────────────────────────────
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',

  // ── Payment ──────────────────────────────────────────────
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_WEBHOOK_INVALID: 'PAYMENT_WEBHOOK_INVALID',

  // ── AI ───────────────────────────────────────────────────
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_RECOMMENDATION_FAILED: 'AI_RECOMMENDATION_FAILED',
} as const;

export type AppErrorCode = (typeof AppErrorCodes)[keyof typeof AppErrorCodes];
