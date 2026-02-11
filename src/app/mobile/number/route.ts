import { type NextRequest, NextResponse } from "next/server";
import { redis, db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
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

    let reporterHash: Buffer | null = null;
    let userType: number | null = null;

    const cached = await redis.get(redisKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed.session !== sessionId) {
        return NextResponse.json(
          { status: "invalid session" },
          { status: 401 },
        );
      }

      userType = parsed.type;

      if (userType === 2 || userType === 0) {
        return statusResponse(userType);
      }

      const [hashBase64] = redisKey.split(":");
      reporterHash = Buffer.from(hashBase64, "base64url");
    }

    if (!reporterHash) {
      const keyParts = redisKey.split(":");
      if (keyParts.length !== 2) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      const [hashBase64, deviceId] = keyParts;
      const mobHash = Buffer.from(hashBase64, "base64url");

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

      reporterHash = mobHash;
    }

    if (!connection) {
      connection = await db.getConnection();
    }

    const [rows] = (await connection.execute(
      `
        SELECT r.encrypted_number, r.type
        FROM reporters rep
        JOIN reported r
          ON r.hashed_number = rep.hashed_reported
        WHERE rep.hashed_number = ?
      `,
      [reporterHash],
    )) as unknown as [{ encrypted_number: Buffer; type: number }[]];

    const reportedNumbers = rows.map((row) => ({
      number: decryptFromBuffer(row.encrypted_number),
      type: row.type,
    }));

    return NextResponse.json({ reportedNumbers }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
