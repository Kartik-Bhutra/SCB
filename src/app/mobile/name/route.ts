import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

interface ReqData {
  token: string;
  name: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { token, name } = (await req.json()) as ReqData;

    if (!token || !name) {
      return NextResponse.json(
        { error: "Missing token or name" },
        { status: 400 },
      );
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const [redisKey] = parts;

    const keyParts = redisKey.split(":");
    if (keyParts.length !== 2) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const [mobHashBase64Url, deviceId] = keyParts;
    const mobHash = Buffer.from(mobHashBase64Url, "base64url");

    connection = await db.getConnection();

    const [result] = await connection.execute(
      {
        sql: `
          UPDATE users
          SET name = ?
          WHERE mobNoHs = ? AND devId = ?
          LIMIT 1
        `,
      },
      [name, mobHash, deviceId],
    );

    const { affectedRows } = result as { affectedRows: number };

    if (affectedRows === 0) {
      return NextResponse.json({ status: "user not found" }, { status: 200 });
    }

    return NextResponse.json({ status: "name updated" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
