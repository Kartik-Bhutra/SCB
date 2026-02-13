import { type NextRequest, NextResponse } from "next/server";
import { db, redis } from "@/db";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  code: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { token, code } = (await req.json()) as ReqData;

    if (!token || !code) {
      return NextResponse.json({ error: "Missing token or code" }, { status: 400 });
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const [redisKey, sessionId] = parts;

    let mobHash: Buffer | null = null;
    let userType: number | null = null;

    const cached = await redis.get(redisKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed.session !== sessionId) {
        return NextResponse.json({ status: "invalid session" }, { status: 401 });
      }

      userType = parsed.type;

      if (userType === 2 || userType === 0) {
        return statusResponse(userType);
      }

      const [hashBase64] = redisKey.split(":");
      mobHash = Buffer.from(hashBase64, "base64url");
    }

    if (!mobHash) {
      const keyParts = redisKey.split(":");
      if (keyParts.length !== 2) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      const [hashBase64, deviceId] = keyParts;
      mobHash = Buffer.from(hashBase64, "base64url");

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
