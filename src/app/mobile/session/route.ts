import { type NextRequest, NextResponse } from "next/server";
import { db, redis } from "@/db";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { token } = (await req.json()) as ReqData;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const [redisKey, sessionId] = parts;

    const cached = await redis.get(redisKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed.session !== sessionId) {
        return NextResponse.json({ status: "invalid session" }, { status: 401 });
      }

      return statusResponse(parsed.type);
    }

    const keyParts = redisKey.split(":");
    if (keyParts.length !== 2) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const [mobHashBase64Url, deviceId] = keyParts;

    const mobHash = Buffer.from(mobHashBase64Url, "base64url");

    connection = await db.getConnection();

    const [rows] = (await connection.execute(
      `
        SELECT type
        FROM devices
        WHERE hashed_number = ?
          AND device_id = ?
        LIMIT 1
      `,
      [mobHash, deviceId],
    )) as unknown as [{ type: number }[]];

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
