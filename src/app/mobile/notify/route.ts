import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, redis } from "@/db";
import { parseToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  code: string;
}

interface DeviceRow extends RowDataPacket {
  type: number;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const body = (await req.json()) as ReqData;
    const token = body?.token?.trim();
    const code = body?.code?.trim();

    if (!token || !code) {
      return NextResponse.json({ error: "Missing token or code" }, { status: 400 });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const { redisKey, sessionId, mobHash, deviceIdBuffer } = parsed;

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
    }

    if (userType === null) {
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
    }

    if (!connection) {
      connection = await db.getConnection();
    }

    await connection.execute(
      `
        INSERT INTO notifications (hashed_number, app)
        VALUES (?, ?)
      `,
      [mobHash, code],
    );

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
