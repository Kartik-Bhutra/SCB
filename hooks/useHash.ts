import { KEY } from "@/types/env";
import { createHmac } from "crypto";
import { CustomError } from "@/lib/error";

export function createHash(payload: string) {
  if (!KEY) {
    throw new CustomError("Server key is missing", 500);
  }
  return createHmac("sha256", KEY).update(payload).digest("base64url");
}

export function verifyHash(payload: string, hashedPayload: string) {
  if (!KEY) {
    return false;
  }
  return (
    hashedPayload ===
    createHmac("sha256", KEY).update(payload).digest("base64url")
  );
}
