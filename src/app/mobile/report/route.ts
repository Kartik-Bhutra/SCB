import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, redis } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { parseToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  reportedNumber: string;
}

interface DeviceRow extends RowDataPacket {
  type: number;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const body = (await req.json()) as ReqData;
    const token = body?.token?.trim();
    const reportedNumber = body?.reportedNumber?.trim();

    if (!token || !reportedNumber) {
      return NextResponse.json({ error: "Missing token or reportedNumber" }, { status: 400 });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const { redisKey, sessionId, mobHash, deviceIdBuffer } = parsed;

    let reporterHash: Buffer | null = null;
    let userType: number | null = null;

    const cached = await redis.get(redisKey);

    if (cached) {
      const redisData = JSON.parse(cached);

      if (redisData.session !== sessionId) {
        return NextResponse.json({ status: "invalid session" }, { status: 401 });
      }

      userType = redisData.type;

      if (userType === 2 || userType === 0) {
        return statusResponse(userType);
      }

      reporterHash = mobHash;
    }

    if (!reporterHash) {
      connection = await db.getConnection();

      const [rows] = await connection.execute<DeviceRow[]>(
        `
          SELECT type
          FROM devices
          WHERE hashed_number = ?
            AND device_id = ?
          LIMIT 1
        `,
        [mobHash, deviceIdBuffer],
      );

      if (!rows.length) {
        return NextResponse.json({ status: "post request" }, { status: 200 });
      }

      userType = rows[0].type;

      if (userType === 2 || userType === 0) {
        return statusResponse(userType);
      }

      reporterHash = mobHash;
    }

    const reportedHash = hashToBuffer(reportedNumber);
    const reportedEncrypted = encryptToBuffer(reportedNumber);

    if (!connection) {
      connection = await db.getConnection();
    }

    await connection.beginTransaction();

    await connection.execute(
      `
        INSERT INTO reported (encrypted_number, hashed_number)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE hashed_number = hashed_number
      `,
      [reportedEncrypted, reportedHash],
    );

    await connection.execute(
      `
        INSERT INTO reporters (hashed_number, hashed_reported)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE hashed_number = hashed_number
      `,
      [reporterHash, reportedHash],
    );

    await connection.commit();

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch {
    if (connection) await connection.rollback();

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
