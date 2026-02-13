import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, redis } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { parseToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
}

interface DeviceRow extends RowDataPacket {
  type: number;
}

interface ReportedRow extends RowDataPacket {
  encrypted_number: Buffer;
  type: number;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const body = (await req.json()) as ReqData;
    const token = body?.token?.trim();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const { redisKey, sessionId, mobHash, deviceIdBuffer } = parsed;

    let userType: number | null = null;
    let reporterHash: Buffer | null = null;

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

    if (!connection) {
      connection = await db.getConnection();
    }

    const [rows] = await connection.execute<ReportedRow[]>(
      `
        SELECT r.encrypted_number, r.type
        FROM reporters rep
        JOIN reported r
          ON r.hashed_number = rep.hashed_reported
        WHERE rep.hashed_number = ?
      `,
      [reporterHash],
    );

    const reportedNumbers = rows.map((row) => ({
      number: decryptFromBuffer(row.encrypted_number),
      type: row.type,
    }));

    return NextResponse.json({ reportedNumbers }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
