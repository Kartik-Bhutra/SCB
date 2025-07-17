import { createHash } from "@/hooks/useHash";
import { verifyToken } from "@/hooks/useJWT";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { clientToken, mergedClient } from "@/types/serverActions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as clientToken;
    const { mobileNo } = verifyToken<mergedClient>(token, true);

    const mobileNoHashed = createHash(mobileNo);

    const cachedToken = await redis.get(mobileNoHashed);
    if (cachedToken === token) {
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT token FROM sessions WHERE mobileNoHashed = ?",
      [mobileNoHashed],
    );
    const row = (rows as clientToken[])[0];

    if (!row || row.token !== token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await redis.set(mobileNoHashed, token, { EX: 86400 });

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
