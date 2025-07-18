import { createHash } from "@/hooks/useHash";
import { signToken, verifyToken } from "@/hooks/useJWT";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import {
  authenticatedClient,
  clientOTP,
  registerClientToken,
} from "@/types/serverActions";
import { verify } from "argon2";
import { encrypt } from "@/hooks/useXCHACHA20";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = (await request.json()) as clientOTP;

    const { mobileNo, username } = verifyToken<registerClientToken>(
      token,
      false,
    );

    const storedOTP = await redis.get(token);
    if (!storedOTP || !(await verify(storedOTP, otp))) {
      return NextResponse.json({ message: "Invalid" }, { status: 401 });
    }

    await redis.del(token);

    const mobileNoHashed = createHash(mobileNo);
    const tokenSid = randomUUID();
    const mobileNoEncrypted = encrypt(mobileNo);
    const db = getDB();
    await db.execute(
      "INSERT INTO users (mobileNoHashed, mobileNoEncrypted, username, token) VALUES (?, ?, ?, ?) ON DUPLICATE  KEY UPDATE  username = VALUES(username), token = VALUES (token)",
      [mobileNoHashed, mobileNoEncrypted, username, tokenSid],
    );

    const [rows] = await db.execute(
      "SELECT authenticated FROM users WHERE mobileNoHashed = ?",
      [mobileNoHashed],
    );

    const authenticated = (rows as authenticatedClient[])[0].authenticated;
    await redis.json.set(mobileNoHashed, "$", {
      token: tokenSid,
      authenticated,
    });

    await redis.expire(mobileNoHashed, 60 * 60 * 24);

    const sid = signToken(
      {
        token: `${mobileNoHashed}:${tokenSid}`,
      },
      true,
    );

    return NextResponse.json({ message: "Verified", sid }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
