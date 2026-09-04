export type HilinkErrorCode =
  | "MODEM_UNREACHABLE"
  | "SESSION_FAILED"
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "TOKEN_EXPIRED"
  | "SIM_ABSENT"
  | "PIN_REQUIRED"
  | "PIN_BLOCKED"
  | "NETWORK_UNAVAILABLE"
  | "SMS_UNSUPPORTED"
  | "SMS_READ_FAILED"
  | "SMS_SEND_FAILED"
  | "SMS_DELETE_FAILED"
  | "INVALID_RESPONSE";

export class HilinkError extends Error {
  readonly code: HilinkErrorCode;

  constructor(code: HilinkErrorCode, message: string) {
    super(message);
    this.name = "HilinkError";
    this.code = code;
  }
}

export function isHilinkError(error: unknown): error is HilinkError {
  return error instanceof HilinkError;
}
