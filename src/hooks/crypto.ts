import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ENC_KEY } from "../../env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const key = ENC_KEY;

export function encryptToBuffer(text: string): Buffer {
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptFromBuffer(buffer: Buffer): string {
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);

  const ciphertext = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted =
    decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
  return decrypted;
}
