import { UUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { db, redis } from "@/db";
import { uuidToBuffer } from "@/hooks/uuid";

interface ParsedToken {
  redisKey: string;
  sessionId: string;
  mobHashBase64Url: string;
  deviceIdStr: string;
}

interface DeviceRow extends RowDataPacket {
  type: number;
}

interface VerifiedToken {
  mobileHash: Buffer;
  deviceId: Buffer;
  type: number;
}

export function parseToken(token: string): ParsedToken | null {
  try {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const redisKey = parts[0];
    const sessionId = parts[1];

    if (!redisKey || !sessionId) return null;

    const keyParts = redisKey.split(":");
    if (keyParts.length !== 2) return null;

    const mobHashBase64Url = keyParts[0];
    const deviceIdStr = keyParts[1];

    if (!mobHashBase64Url || !deviceIdStr) return null;

    return {
      redisKey,
      sessionId,
      mobHashBase64Url,
      deviceIdStr,
    };
  } catch {
    return null;
  }
}

export async function verifyToken(parsed: ParsedToken | null): Promise<VerifiedToken | null> {
  if (!parsed) return null;

  const { redisKey, sessionId, mobHashBase64Url, deviceIdStr } = parsed;

  const mobileHash = Buffer.from(mobHashBase64Url, "base64url");
  const deviceIdBuffer = uuidToBuffer(deviceIdStr as UUID);

  const cached = await redis.get(redisKey);

  if (cached) {
    try {
      const data = JSON.parse(cached);

      if (data.session !== sessionId) return null;

      return {
        mobileHash,
        deviceId: deviceIdBuffer,
        type: data.type,
      };
    } catch {
      return null;
    }
  }

  try {
    const [rows] = await db.execute<DeviceRow[]>(
      `
        SELECT type
        FROM devices
        WHERE hashed_number = ?
          AND device_id = ?
        LIMIT 1
      `,
      [mobileHash, deviceIdBuffer],
    );

    if (!rows.length) return null;

    const type = rows[0].type;

    await redis.set(
      redisKey,
      JSON.stringify({
        session: sessionId,
        type,
      }),
      {
        expiration: { type: "EX", value: 604800 },
      },
    );

    return {
      mobileHash,
      deviceId: deviceIdBuffer,
      type,
    };
  } catch {
    return null;
  }
}
