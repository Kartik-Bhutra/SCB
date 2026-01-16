import { type NextRequest, NextResponse } from "next/server";
import { client, pool } from "@/db";
import { STATUS_MAP } from "@/types/serverActions";

interface ReqData {
  token: string;
}

function statusResponse(type: number) {
  const status = STATUS_MAP.get(type);

  if (!status) {
    return NextResponse.json({ error: "Invalid user type" }, { status: 500 });
  }

  if (type === 2) {
    return NextResponse.json({ status, type }, { status: 403 });
  }

  return NextResponse.json({ status, type }, { status: 200 });
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

      return statusResponse(parsed.type);
    }

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
    )) as unknown as [number[][]];

    if (rows.length === 0) {
      return NextResponse.json({ status: "post request" }, { status: 200 });
    }

    return statusResponse(rows[0][0]);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
