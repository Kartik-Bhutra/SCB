import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { parseToken, verifyToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
  code: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReqData;
    const token = body?.token?.trim();
    const code = body?.code?.trim();

    if (!token || !code) {
      return NextResponse.json({ error: "Missing token or code" }, { status: 400 });
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

    await db.execute(
      `
        INSERT INTO notifications (hashed_number, app)
        VALUES (?, ?)
      `,
      [verified.mobileHash, code],
    );

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
