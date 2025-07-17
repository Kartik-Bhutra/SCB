import { signToken, verifyToken } from "@/hooks/useJWT";
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

    const payload = verifyToken<registerClientToken>(token, false);

    const otp = generateSixDigitOTP();
    const otpHash = await hash(otp);

    console.log("OTP:", otp);
    const otpToken = signToken(payload, true);
    const result = await redis.set(otpToken, otpHash, { EX: 600 });
    if (result !== "OK") {
      throw new CustomError("Server error", 500);
    }
    return NextResponse.json(
      { message: "OK", token: otpToken },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
