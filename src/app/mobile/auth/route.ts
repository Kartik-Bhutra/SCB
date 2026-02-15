import { randomUUID, UUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, redis } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { uuidToBuffer } from "@/hooks/uuid";
import { statusResponse } from "@/server/response";

interface ReqData {
  mobileNo: string;
  deviceId: string;
}

interface DeviceRow extends RowDataPacket {
  type: number;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const body = (await req.json()) as ReqData;
    const mobileNo = body?.mobileNo?.trim();
    const deviceIdStr = body?.deviceId?.trim();

    if (!mobileNo || !deviceIdStr) {
      return NextResponse.json({ error: "Missing mobileNo or deviceId" }, { status: 400 });
    }

    const mobileHash = hashToBuffer(mobileNo);
    const encryptedMobile = encryptToBuffer(mobileNo);
    const deviceIdBuffer = uuidToBuffer(deviceIdStr as UUID);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [userRows] = await connection.execute<RowDataPacket[]>(
      `
        SELECT 1
        FROM users
        WHERE hashed_number = ?
        LIMIT 1
      `,
      [mobileHash],
    );

    if (!userRows.length) {
      await connection.execute(
        `
          INSERT INTO users
            (hashed_number, encrypted_number, name)
          VALUES (?, ?, '')
        `,
        [mobileHash, encryptedMobile],
      );

      await connection.execute(
        `
          INSERT INTO devices
            (device_id, hashed_number, type)
          VALUES (?, ?, 0)
        `,
        [deviceIdBuffer, mobileHash],
      );
    } else {
      await connection.execute(
        `
          INSERT IGNORE INTO devices
            (device_id, hashed_number)
          VALUES (?, ?)
        `,
        [deviceIdBuffer, mobileHash],
      );
    }

    const [deviceRows] = await connection.execute<DeviceRow[]>(
      `
        SELECT type
        FROM devices
        WHERE hashed_number = ?
          AND device_id = ?
        LIMIT 1
      `,
      [mobileHash, deviceIdBuffer],
    );

    const type = deviceRows[0].type;

    await connection.commit();
    connection.release();

    if (type === 2) {
      return statusResponse(2);
    }

    const sessionId = randomUUID();
    const mobileHashBase = mobileHash.toString("base64url");
    const redisKey = `${mobileHashBase}:${deviceIdStr}`;

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

    const token = `${redisKey}.${sessionId}`;

    return NextResponse.json({ status: "OK", token, type }, { status: 200 });
  } catch {
    if (connection) await connection.rollback();

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
