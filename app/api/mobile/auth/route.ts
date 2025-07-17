import { verifyToken } from "@/hooks/useJWT";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { authToken, clientToken } from "@/types/serverActions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as clientToken;

    const payload = verifyToken<clientToken>(token, true);
    const sid = payload.token;

    const [mobileNoHashed, deviceToken] = sid.split(":");

    const cached = (await redis.json.get(mobileNoHashed)) as authToken | null;

    if (cached && cached.token === deviceToken) {
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT token, authenticated FROM users WHERE mobileNoHashed = ?",
      [mobileNoHashed],
    );
    const row = (rows as authToken[])[0];

    if (!row || row.token !== deviceToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await redis.json.set(mobileNoHashed, "$", {
      token: row.token,
      authenticated: row.authenticated,
    });

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
