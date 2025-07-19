import { createHash } from "@/hooks/useHash";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

function generateSixDigitOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface register {
  mobileNo: string;
}

interface clients {
  userType: number;
}

export async function POST(request: NextRequest) {
  try {
    const { mobileNo } = (await request.json()) as register;

    if (!mobileNo) {
      throw new CustomError("Fill user details", 400);
    }

    const MNH = createHash(mobileNo);
    const db = getDB();
    const [rows] = await db.execute(
      `SELECT userType FROM clients WHERE MNH = ?`,
      [MNH],
    );
    const userType = (rows as clients[])[0]?.userType;

    if (userType && userType === 0) {
      throw new CustomError("mobileNo not allowed", 401);
    }

    const otp = generateSixDigitOTP();
    console.log("OTP:", otp);
    const otpHash = createHash(otp);

    await redis.json.set(MNH, "$", {
      otp: otpHash,
      exists: userType ?? 0,
    });
    await redis.expire(MNH, 60 * 10);

    return NextResponse.json(
      { message: "OK", exists: userType ?? 0 },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
