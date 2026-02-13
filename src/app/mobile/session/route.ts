import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, redis } from "@/db";
import { parseToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
}

interface DeviceRow extends RowDataPacket {
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

    const parsedToken = parseToken(token);
    if (!parsedToken) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const { redisKey, sessionId, mobHash, deviceIdBuffer } = parsedToken;

    const cached = await redis.get(redisKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed.session !== sessionId) {
        return NextResponse.json({ status: "invalid session" }, { status: 401 });
      }

      return statusResponse(parsed.type);
    }

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

    return statusResponse(rows[0].type);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
