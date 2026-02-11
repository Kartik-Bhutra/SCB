import { type NextRequest, NextResponse } from "next/server";
import { redis, db } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  reportedNumber: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { token, reportedNumber } = (await req.json()) as ReqData;

    if (!token || !reportedNumber) {
      return NextResponse.json(
        { error: "Missing token or reportedNumber" },
        { status: 400 },
      );
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const [redisKey, sessionId] = parts;

    const cached = await redis.get(redisKey);

    let reporterHash: Buffer | null = null;
    let userType: number | null = null;

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
        ON DUPLICATE KEY UPDATE encrypted_number = encrypted_number
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
