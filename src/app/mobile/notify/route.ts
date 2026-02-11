import { type NextRequest, NextResponse } from "next/server";
import { redis, db } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  code: string;
}

export async function POST(req: NextRequest) {
  let connection;
  let mobNoEn: Buffer | null = null;

  try {
    const { token, code } = (await req.json()) as ReqData;

    if (!token || !code) {
      return NextResponse.json(
        { error: "Missing token or code" },
        { status: 400 },
      );
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const [redisKey, session] = parts;

    const cached = await redis.get(redisKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed.session !== session) {
        return NextResponse.json(
          { status: "invalid session" },
          { status: 401 },
        );
      }

      if (parsed.type === 2 || parsed.type === 0) {
        return statusResponse(parsed.type);
      }

      mobNoEn = encryptToBuffer(parsed.mobileNo);
    }

    if (!mobNoEn) {
      const keyParts = redisKey.split(":");
      if (keyParts.length !== 2) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      const [mobHashBase64Url, deviceId] = keyParts;
      const mobHash = Buffer.from(mobHashBase64Url, "base64url");

      connection = await db.getConnection();

      const [rows] = (await connection.execute(
        {
          sql: `
            SELECT type, mobNoEn
            FROM users
            WHERE mobNoHs = ? AND devId = ?
            LIMIT 1
          `,
          rowsAsArray: true,
        },
        [mobHash, deviceId],
      )) as unknown as [[number, Buffer][]];

      if (rows.length === 0) {
        return NextResponse.json({ status: "post request" }, { status: 200 });
      }

      const [type, encryptedMobNo] = rows[0];

      if (type === 2 || type === 0) {
        return statusResponse(type);
      }

      mobNoEn = encryptedMobNo;
    }

    if (!connection) {
      connection = await db.getConnection();
    }

    await connection.execute(
      `
        INSERT INTO notify (mobNoEn, code)
        VALUES (?, ?)
      `,
      [mobNoEn, code],
    );

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
