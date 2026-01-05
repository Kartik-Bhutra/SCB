import { rpID } from "../env";

export type authActionResult =
  | ""
  | "OK"
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "PASSKEY_NOT_FOUND"
  | "WEBAUTHN_FAILED"
  | "INTERNAL_ERROR";

export type ActionResult =
  | ""
  | "OK"
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "INTERNAL_ERROR";

export const origin = `http://${rpID}:3000`;
