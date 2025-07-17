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

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = (await request.json()) as clientOTP;

    const { mobileNo, username, deviceId } = verifyToken<registerClientToken>(
      token,
      false,
    );

    const storedOTP = await redis.get(token);
    if (!storedOTP || !(await verify(storedOTP, otp))) {
      return NextResponse.json({ message: "Invalid" }, { status: 401 });
    }

    await redis.del(token);

    const mobileNoHashed = createHash(mobileNo);
    const deviceIdHashed = createHash(deviceId);
    const mobileNoEncrypted = encrypt(mobileNo);
    const db = getDB();
    await db.execute(
      "INSERT INTO users (mobileNoHashed, mobileNoEncrypted, username, token) VALUES (?, ?, ?, ?) ON DUPLICATE  KEY UPDATE  username = VALUES(username), token = VALUES (token)",
      [mobileNoHashed, mobileNoEncrypted, username, deviceIdHashed],
    );

    const [rows] = await db.execute(
      "SELECT authenticated FROM users WHERE mobileNoHashed = ?",
      [mobileNoHashed],
    );

    const authenticated = (rows as authenticatedClient[])[0].authenticated;
    await redis.json.set(mobileNoHashed, "$", {
      token: deviceIdHashed,
      authenticated,
    });

    const sid = signToken(
      {
        token: `${mobileNoHashed}:${deviceIdHashed}`,
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
