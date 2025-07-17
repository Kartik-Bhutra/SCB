import { verifyToken } from "@/hooks/useJWT";
import { CustomError } from "@/lib/error";
import redis from "@/lib/redis";
import { clientToken, registerClientToken } from "@/types/serverActions";
import { hash } from "argon2";
import { NextRequest, NextResponse } from "next/server";

function generateSixDigitOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as clientToken;

    verifyToken<registerClientToken>(token, false);

    const otp = generateSixDigitOTP();
    const otpHash = await hash(otp);

    console.log("OTP:", otp);
    const result = await redis.set(token, otpHash, { EX: 600 });
    if (result !== "OK") {
      throw new CustomError("Server error", 500);
    }
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
