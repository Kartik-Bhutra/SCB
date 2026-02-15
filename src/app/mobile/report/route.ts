import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { parseToken, verifyToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  reportedNumber: string;
}

export async function POST(req: NextRequest) {
  let connection;

  try {
    const body = (await req.json()) as ReqData;
    const token = body?.token?.trim();
    const reportedNumber = body?.reportedNumber?.trim();

    if (!token || !reportedNumber) {
      return NextResponse.json({ error: "Missing token or reportedNumber" }, { status: 400 });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    const verified = await verifyToken(parsed);
    if (!verified) {
      return NextResponse.json({ status: "invalid session" }, { status: 401 });
    }

    if (verified.type === 2 || verified.type === 0) {
      return statusResponse(verified.type);
    }

    const reporterHash = verified.mobileHash;
    const reportedHash = hashToBuffer(reportedNumber);
    const reportedEncrypted = encryptToBuffer(reportedNumber);

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `
        INSERT INTO reported (encrypted_number, hashed_number)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE hashed_number = hashed_number
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

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
