import { rpID, rpPORT } from "../env";

export type loginActionResult =
  | ""
  | "OK"
  | "INVALID INPUT"
  | "INVALID CREDENTIALS"
  | "UNAUTHORIZED"
  | "SESSION EXPIRED"
  | "INVALID SESSION"
  | "PASSKEY NOT FOUND"
  | "WEBAUTHN FAILED"
  | "SERVER ERROR";

export type keyActionResult =
  | ""
  | "OK"
  | "INVALID INPUT"
  | "INVALID CREDENTIALS"
  | "INVALID SESSION"
  | "SESSION EXPIRED"
  | "PASSKEY_ALREADY_EXISTS"
  | "WEBAUTHN FAILED"
  | "SERVER ERROR";

export type passwordActionResult =
  | ""
  | "OK"
  | "INVALID INPUT"
  | "INVALID_PASSWORD"
  | "INVALID CREDENTIALS"
  | "SERVER ERROR";

export type ActionResult =
  | ""
  | "OK"
  | "INVALID INPUT"
  | "INVALID CREDENTIALS"
  | "UNAUTHORIZED"
  | "SESSION EXPIRED"
  | "SERVER ERROR";

export const origin = `http://${rpID}:${rpPORT}`;

export const STATUS_MAP = new Map<number, string>([
  [0, "not accepted"],
  [1, "accepted"],
  [2, "not authorized"],
]);
