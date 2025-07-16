import { createHash } from "@/hooks/useHash";
import { verifyTokenPayload } from "@/hooks/useJWT";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { clientOTP, registerClientToken } from "@/types/serverActions";
import { verify } from "argon2";
import { encrypt } from "@/hooks/useXCHACHA20";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = (await request.json()) as clientOTP;

    const { mobileNo, username } = verifyTokenPayload<registerClientToken>(
      token,
      false,
    );

    const storedHash = await redis.get(token);
    if (!storedHash || !(await verify(storedHash, otp))) {
      return NextResponse.json({ message: "Invalid" }, { status: 401 });
    }

    await redis.del(token);

    const mobileNoHashed = createHash(mobileNo);
    const mobileNoEncrypted = encrypt(mobileNo);

    const db = getDB();
    await db.execute(
      "INSERT IGNORE INTO users (mobileNoHashed, mobileNoEncrypted, username) VALUES (?, ?, ?)",
      [mobileNoHashed, mobileNoEncrypted, username],
    );

    await db.execute(
      "INSERT INTO sessions (token, mobileNoHashed) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token)",
      [token, mobileNoHashed],
    );

    await redis.set(mobileNoHashed, token, { EX: 86400 });

    return NextResponse.json({ message: "Verified" }, { status: 200 });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
