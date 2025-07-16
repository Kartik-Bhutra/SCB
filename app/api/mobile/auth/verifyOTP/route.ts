import { verifyTokenPayload } from "@/hooks/useJWT";
import { CustomError } from "@/lib/error";
import redis from "@/lib/redis";
import { clientOTP, registerClientToken } from "@/types/serverActions";
import { verify } from "argon2";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = (await request.json()) as clientOTP;

    verifyTokenPayload<registerClientToken>(token, false);

    const storedHash = await redis.get(token);
    if (!storedHash) {
      throw new CustomError("OTP expired or not found", 400);
    }
    const isMatch = await verify(storedHash, otp);
    if (!isMatch) {
      throw new CustomError("Invalid OTP", 401);
    }
    return NextResponse.json({ message: "OTP verified" }, { status: 200 });
  } catch (err) {
    if (err instanceof CustomError) {
      return NextResponse.json(err.toJSON(), { status: err.statusCode });
    }
    return NextResponse.json({ message: "Unknown error" }, { status: 500 });
  }
}
