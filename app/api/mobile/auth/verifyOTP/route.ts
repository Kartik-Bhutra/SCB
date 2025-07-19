import { createHash } from "@/hooks/useHash";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { encrypt } from "@/hooks/useXCHACHA20";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface verify {
  mobileNo: string;
  otp: string;
  username?: string;
  department?: string;
}
interface verifyOTP {
  otp: string;
  exists: number;
}

interface clients {
  userType: number;
}

export async function POST(request: NextRequest) {
  try {
    const { mobileNo, otp, username, department } =
      (await request.json()) as verify;
    if (!mobileNo || !otp) {
      throw new CustomError("Fill user details", 400);
    }
    const MNH = createHash(mobileNo);
    const otpHashed = createHash(otp);

    const stored = (await redis.json.get(MNH)) as verifyOTP | null;
    if (!stored || stored.otp !== otpHashed) {
      return NextResponse.json({ message: "Invalid" }, { status: 401 });
    }
    await redis.del(MNH);

    const tokenSid = randomUUID();
    const sid = `${MNH}:${tokenSid}`;
    const db = getDB();

    if (stored.exists === 0) {
      if (!username || !department) {
        throw new CustomError("Fill user details", 400);
      }
      const MNE = encrypt(mobileNo);

      await db.execute(
        "INSERT INTO clients (MNH, MNE, username, token, department)VALUES (?, ?, ?, ?, ?)",
        [MNH, MNE, username, tokenSid, department],
      );
    }

    const [rows] = await db.execute(
      `SELECT userType FROM clients WHERE MNH = ?`,
      [MNH],
    );

    const userType = (rows as clients[])[0].userType;

    await redis.json.set(MNH, "$", {
      token: tokenSid,
      userType,
    });
    await redis.expire(MNH, 60 * 60 * 24);
    return NextResponse.json({ message: "Verified", sid }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
