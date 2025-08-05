import { CustomError } from "@/lib/error";
import { mobileAuth } from "@/utils/clientAction";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as {
      token: string;
    };
    if (!token) {
      throw new CustomError("Missing authentication token", 400);
    }

    const { success, userType, error: authError } = await mobileAuth(token);
    if (!success) {
      throw new CustomError(authError || "Invalid Token", 401);
    }
    if (userType === 0) {
      throw new CustomError(authError || "Authentication failed", 403);
    }
    return NextResponse.json(
      {
        userType: userType || 1,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "Server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
