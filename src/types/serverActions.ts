import { rpID } from "../env";

export type ActionResult =
  | ""
  | "OK"
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "INTERNAL_ERROR";

export const origin = `http://${rpID}:3000`;
