import { CustomError } from "@/lib/error";
import { KEY } from "@/types/env";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils";
import { randomBytes } from "@noble/ciphers/webcrypto";

export function encrypt(payload: string) {
  if (!KEY) {
    throw new CustomError("Server error", 500);
  }
  const nonce = randomBytes(24);
  const chacha = xchacha20poly1305(utf8ToBytes(KEY), nonce);
  const encrypted = chacha.encrypt(utf8ToBytes(payload));
  return `${Buffer.from(encrypted).toString("base64url")}:${Buffer.from(nonce).toString("base64url")}`;
}

export function decrypt(payload: string) {
  if (!KEY) {
    throw new CustomError("Server error", 500);
  }

  const [dataEncoded, nonceEncoded] = payload.split(":");
  if (!dataEncoded || !nonceEncoded) {
    throw new CustomError("Corrupted encrypted payload", 400);
  }

  const chacha = xchacha20poly1305(
    utf8ToBytes(KEY),
    Buffer.from(nonceEncoded, "base64url"),
  );

  try {
    const decrypted = chacha.decrypt(Buffer.from(dataEncoded, "base64url"));
    return bytesToUtf8(decrypted);
  } catch {
    throw new CustomError("Decryption failed", 400);
  }
}
