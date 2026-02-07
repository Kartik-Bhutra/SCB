import { type NextRequest, NextResponse } from "next/server";
import { client, pool } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  reportedNumber: string;
}

export async function POST(req: NextRequest) {
  let connection;
  let reporterMobHash: Buffer | null = null;

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

    const [redisKey, session] = parts;
    const cached = await client.get(redisKey);

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

      reporterMobHash = hashToBuffer(parsed.mobileNo);
    }

    if (!reporterMobHash) {
      const keyParts = redisKey.split(":");
      if (keyParts.length !== 2) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      const [mobHashBase64Url, deviceId] = keyParts;
      const mobHash = Buffer.from(mobHashBase64Url, "base64url");

      connection = await pool.getConnection();

      const [rows] = (await connection.execute(
        {
          sql: `
            SELECT type
            FROM users
            WHERE mobNoHs = ? AND devId = ?
            LIMIT 1
          `,
          rowsAsArray: true,
        },
        [mobHash, deviceId],
      )) as unknown as [[number][]];

      if (rows.length === 0) {
        return NextResponse.json({ status: "post request" }, { status: 200 });
      }

      const [type] = rows[0];

      if (type === 2 || type === 0) {
        return statusResponse(type);
      }
    }

    if (!connection) {
      connection = await pool.getConnection();
    }

    const reportedHash = hashToBuffer(reportedNumber);
    const reportedEncrypted = encryptToBuffer(reportedNumber);

    const [repCheck] = (await connection.execute(
      `
  SELECT 1
  FROM reported
  WHERE mobNoHs = ?
  LIMIT 1
  `,
      [reportedHash],
    )) as unknown as [number[][]];

    if (repCheck.length === 0) {
      await connection.execute(
        `
    INSERT INTO reported (mobNoEn, mobNoHs)
    VALUES (?, ?)
    `,
        [reportedEncrypted, reportedHash],
      );
    }

    const [exists] = (await connection.execute(
      `
  SELECT 1
  FROM reporter
  WHERE mobNoHs = ? AND repNoHs = ?
  LIMIT 1
  `,
      [reporterMobHash, reportedHash],
    )) as unknown as [number[][]];

    if (exists.length > 0) {
      return NextResponse.json({ status: "ALREADY_REPORTED" }, { status: 200 });
    }

    await connection.execute(
      `
  INSERT INTO reporter (mobNoHs, repNoHs)
  VALUES (?, ?)
  `,
      [reporterMobHash, reportedHash],
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
