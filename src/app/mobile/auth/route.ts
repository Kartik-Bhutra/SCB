import { NextRequest, NextResponse } from "next/server";
import { client, pool } from "@/db";
import { hashToBuffer } from "@/hooks/hash";
import { encryptToBuffer } from "@/hooks/crypto";
import { randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const mobileNo = (await req.text()).trim();

    if (!mobileNo) {
      return NextResponse.json(
        { error: "Missing mobileNo or deviceId" },
        { status: 400 }
      );
    }

    const mobileHash = hashToBuffer(mobileNo);

    const connection = await pool.getConnection();

    const [rows] = (await connection.execute(
      {
        sql: `
          SELECT type
          FROM users
          WHERE mobNoHs = ?
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [mobileHash]
    )) as unknown as [number[][]];

    if (rows.length === 0) {
      await connection.execute(
        `
          INSERT INTO users (name, mobNoEn, mobNoHs, type)
          VALUES ('', ?, ?, ?, 0)
        `,
        [encryptToBuffer(mobileNo), mobileHash]
      );

      return NextResponse.json({ status: "not accepted" }, { status: 200 });
    }

    connection.release();

    const userType = rows[0][0];

    if (userType === 2) {
      return NextResponse.json({ status: "not authorized" }, { status: 200 });
    }

    if (userType === 0) {
      return NextResponse.json({ status: "not accepted" }, { status: 200 });
    }

    const sessionId = randomUUID();
    const redisKey = mobileHash.toString("base64");
    const token = redisKey + sessionId;

    await client.set(redisKey, sessionId);

    return NextResponse.json({ status: "accepted", token }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
