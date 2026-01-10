import { type NextRequest, NextResponse } from "next/server";
import { client, pool } from "@/db";

interface ReqData {
  token: string;
}

export async function GET(req: NextRequest) {
  let connection;

  try {
    const { token } = (await req.json()) as ReqData;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    let parts = token.split(".");
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

      return NextResponse.json(
        { status: "accepted", type: parsed.type },
        { status: 200 },
      );
    }

    parts = redisKey.split(":");
    if (parts.length !== 2) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const [mobHashBase64Url, deviceId] = parts;

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

    const type = rows[0][0];

    if (type === 0) {
      return NextResponse.json({ status: "not accepted" }, { status: 200 });
    }

    if (type === 2) {
      return NextResponse.json({ status: "not authorized" }, { status: 403 });
    }

    return NextResponse.json({ status: "accepted", type }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
