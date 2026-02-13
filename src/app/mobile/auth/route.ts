import { randomUUID, UUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, redis } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { uuidToBuffer } from "@/hooks/uuid";
import { STATUS_MAP } from "@/types/serverActions";

interface ReqData {
  mobileNo: string;
  deviceId: string;
}

interface BlockRow extends RowDataPacket {
  type: number;
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
    const deviceIdBuffer = uuidToBuffer(deviceIdStr as UUID);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [blockedRows] = await connection.execute<BlockRow[]>(
      `
        SELECT type
        FROM blocks
        WHERE hashed_number = ?
        LIMIT 1
      `,
      [mobileHash],
    );

    if (blockedRows.length && blockedRows[0].type === 0) {
      await connection.rollback();
      return NextResponse.json({ status: "blocked" }, { status: 403 });
    }

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
        [mobileHash, encryptToBuffer(mobileNo)],
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

    let type = 0;

    if (!deviceRows.length) {
      try {
        await connection.execute(
          `
            INSERT INTO devices
              (device_id, hashed_number, type)
            VALUES (?, ?, 0)
          `,
          [deviceIdBuffer, mobileHash],
        );
      } catch (err: any) {
        if (err?.code !== "ER_DUP_ENTRY") throw err;
      }
    } else {
      type = deviceRows[0].type;
    }

    await connection.commit();

    const status = STATUS_MAP.get(type);
    if (!status) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 500 });
    }

    if (type === 2) {
      return NextResponse.json({ status, type }, { status: 403 });
    }

    const sessionId = randomUUID();
    const redisKey = `${mobileHash.toString("base64url")}:${deviceIdStr}`;

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

    return NextResponse.json({ status, token, type }, { status: 200 });
  } catch {
    if (connection) await connection.rollback();

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
