import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { redis, db } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { STATUS_MAP } from "@/types/serverActions";

interface ReqData {
  mobileNo: string;
  deviceId: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { mobileNo, deviceId } = (await req.json()) as ReqData;

    if (!mobileNo || !deviceId) {
      return NextResponse.json(
        { error: "Missing mobileNo or deviceId" },
        { status: 400 },
      );
    }

    const mobileHash = hashToBuffer(mobileNo);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [blockedRows] = (await connection.execute(
      `
        SELECT type
        FROM blocks
        WHERE hashed_number = ?
        LIMIT 1
      `,
      [mobileHash],
    )) as unknown as [{ type: number }[]];

    if (blockedRows.length && blockedRows[0].type === 1) {
      await connection.rollback();
      return NextResponse.json({ status: "blocked" }, { status: 403 });
    }

    const [userRows] = (await connection.execute(
      `
        SELECT 1
        FROM users
        WHERE hashed_number = ?
        LIMIT 1
      `,
      [mobileHash],
    )) as unknown as [unknown[]];

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

    const [deviceRows] = (await connection.execute(
      `
        SELECT type
        FROM devices
        WHERE hashed_number = ?
          AND device_id = ?
        LIMIT 1
      `,
      [mobileHash, deviceId],
    )) as unknown as [{ type: number }[]];

    let type = 0;

    if (!deviceRows.length) {
      await connection.execute(
        `
          INSERT INTO devices
            (device_id, hashed_number, type)
          VALUES (?, ?, 0)
        `,
        [deviceId, mobileHash],
      );
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
    const redisKey = `${mobileHash.toString("base64url")}:${deviceId}`;

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
