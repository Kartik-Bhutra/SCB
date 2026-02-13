import { UUID } from "node:crypto";
import { uuidToBuffer } from "@/hooks/uuid";

interface ParsedToken {
  redisKey: string;
  sessionId: string;
  mobHash: Buffer;
  deviceIdBuffer: Buffer;
}

export function parseToken(token: string): ParsedToken | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [redisKey, sessionId] = parts;

  const keyParts = redisKey.split(":");
  if (keyParts.length !== 2) return null;

  const [mobHashBase64Url, deviceIdStr] = keyParts;

  try {
    const mobHash = Buffer.from(mobHashBase64Url, "base64url");
    const deviceIdBuffer = uuidToBuffer(deviceIdStr as UUID);

    return {
      redisKey,
      sessionId,
      mobHash,
      deviceIdBuffer,
    };
  } catch {
    return null;
  }
}
