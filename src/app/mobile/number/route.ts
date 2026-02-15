import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { parseToken, verifyToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
}

interface ReportedRow extends RowDataPacket {
  encrypted_number: Buffer;
  type: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReqData;
    const token = body?.token?.trim();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
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

    const [rows] = await db.execute<ReportedRow[]>(
      `
        SELECT r.encrypted_number, r.type
        FROM reporters rep
        JOIN reported r
          ON r.hashed_number = rep.hashed_reported
        WHERE rep.hashed_number = ?
      `,
      [verified.mobileHash],
    );

    const reportedNumbers = rows.map((row) => ({
      number: decryptFromBuffer(row.encrypted_number),
      type: row.type,
    }));

    return NextResponse.json({ reportedNumbers }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
