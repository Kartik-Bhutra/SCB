import { verifyTokenPayload } from "@/hooks/useJWT";
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

    verifyTokenPayload<registerClientToken>(token, false);

    const otp = generateSixDigitOTP();
    const otpHash = await hash(otp);

    console.log("OTP for testing:", otp);

    const result = await redis.set(token, otpHash, {
      EX: 60 * 10,
    });
    if (result !== "OK") {
      throw new CustomError("Failed to store OTP", 500);
    }

    return NextResponse.json({ message: "OTP generated" }, { status: 200 });
  } catch (err) {
    if (err instanceof CustomError) {
      return NextResponse.json(err.toJSON(), { status: err.statusCode });
    }
    return NextResponse.json({ message: "Unknown error" }, { status: 500 });
  }
}
