import { rpID } from "../env";

export type loginActionResult =
  | ""
  | "OK"
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "PASSKEY_NOT_FOUND"
  | "WEBAUTHN_FAILED"
  | "INTERNAL_ERROR";

export type keyActionResult =
  | ""
  | "OK"
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "PASSKEY_ALREADY_EXISTS"
  | "WEBAUTHN_FAILED"
  | "INTERNAL_ERROR";

export type passwordActionResult =
  | ""
  | "OK"
  | "INVALID_INPUT"
  | "INVALID_PASSWORD"
  | "INVALID_CREDENTIALS"
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

export const STATUS_MAP = new Map<number, string>([
  [0, "not accepted"],
  [1, "accepted"],
  [2, "not authorized"],
]);
