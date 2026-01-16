import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { client, pool } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { STATUS_MAP } from "@/types/serverActions";

interface ReqData {
  mobileNo: string;
  deviceId: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { mobileNo, deviceId } = (await req.json()) as ReqData;

    if (!mobileNo || !deviceId) {
      return NextResponse.json(
        { error: "Missing mobileNo or deviceId" },
        { status: 400 },
      );
    }

    const mobileHash = hashToBuffer(mobileNo);
    connection = await pool.getConnection();

    const [blocked] = (await connection.execute(
      {
        sql: `
          SELECT 1
          FROM blocks
          WHERE mobNoHs = ?
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [mobileHash],
    )) as unknown as [number[][]];

    if (blocked.length) {
      return NextResponse.json({ status: "blocked" }, { status: 403 });
    }

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
      [mobileHash, deviceId],
    )) as unknown as [number[][]];

    let type: number = 0;

    if (rows.length === 0) {
      await connection.execute(
        `
          INSERT INTO users (name, mobNoEn, mobNoHs, devId)
          VALUES ('', ?, ?, ?)
        `,
        [encryptToBuffer(mobileNo), mobileHash, deviceId],
      );
    } else {
      type = rows[0][0];
    }

    const status = STATUS_MAP.get(type);

    if (!status) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 500 });
    }

    if (type === 2) {
      return NextResponse.json({ status, type }, { status: 403 });
    }

    const session = randomUUID();
    const redisKey = `${mobileHash.toString("base64url")}:${deviceId}`;

    await client.set(redisKey, JSON.stringify({ session, type, mobileNo }), {
      expiration: {
        type: "EX",
        value: 604800,
      },
    });

    const token = `${redisKey}.${session}`;

    return NextResponse.json({ status, token }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
