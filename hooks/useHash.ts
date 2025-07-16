import { KEY } from "@/types/env";
import { createHmac, timingSafeEqual } from "crypto";
import { CustomError } from "@/lib/error";

export function createHash(payload: string) {
  if (!KEY) {
    throw new CustomError("Server error", 500);
  }
  return createHmac("sha256", KEY).update(payload).digest("base64url");
}

export function verifyHash(payload: string, hashedPayload: string) {
  if (!KEY) return false;
  const expected = createHmac("sha256", KEY).update(payload).digest();
  const given = Buffer.from(hashedPayload, "base64url");

  if (expected.length !== given.length) return false;

  return timingSafeEqual(expected, given);
}
