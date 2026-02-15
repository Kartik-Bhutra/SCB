import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseToken, verifyToken } from "@/server/client";
import { statusResponse } from "@/server/response";

interface ReqData {
  token: string;
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

    return statusResponse(verified.type);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
