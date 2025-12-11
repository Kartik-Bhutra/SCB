import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { ENC_KEY } from "../../env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function tryDecodeCandidate(candidate: string | Buffer): Buffer | null {
  // If it's a Buffer representing the *raw* key, return it if 32 bytes.
  if (Buffer.isBuffer(candidate) && candidate.length === 32) return candidate;

  const asStr = Buffer.isBuffer(candidate) ? candidate.toString("utf8") : String(candidate);

  try {
    const b = Buffer.from(asStr, "base64");
    if (b.length === 32) return b;
  } catch (_) {}

  try {
    const b = Buffer.from(asStr, "hex");
    if (b.length === 32) return b;
  } catch (_) {}

  if (Buffer.isBuffer(candidate)) {
    try {
      const text = candidate.toString("utf8");
      const b = Buffer.from(text, "base64");
      if (b.length === 32) return b;
    } catch (_) {}
    try {
      const text = candidate.toString("utf8");
      const b = Buffer.from(text, "hex");
      if (b.length === 32) return b;
    } catch (_) {}
  }
  if (asStr.length > 0 && asStr.length < 200) {
    const derived = createHash("sha256").update(asStr, "utf8").digest();
    if (derived.length === 32) return derived;
  }

  return null;
}

function getKeyFromEnv(envKey: unknown): Buffer {
  const candidate = envKey as string | Buffer | undefined;
  if (candidate === undefined) {
    throw new Error("ENC_KEY is not defined");
  }

  if (Buffer.isBuffer(candidate) && candidate.length === 32) return candidate;

  const decoded = tryDecodeCandidate(candidate);
  if (decoded) return decoded;

  const got = Buffer.isBuffer(candidate) ? `Buffer length ${candidate.length}` : `string length ${String(candidate).length}`;
  throw new Error(
    `ENC_KEY is not a valid 32-byte key. Tried base64/hex/utf8/passphrase decoding. Got ${got}. ` +
    `Recommended: set ENC_KEY to a 32-byte key encoded as base64 (preferred) or hex.`
  );
}

const key = getKeyFromEnv(ENC_KEY);

export function encryptToBuffer(text: string): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptFromBuffer(buffer: Buffer): string {
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
