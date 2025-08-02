import { decrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { blockedCodes, blockedData } from "@/types/serverActions";
import { mobileAuth } from "@/utils/clientAction";
import { NextRequest, NextResponse } from "next/server";

interface check {
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as check;

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
    if (userType === 1) {
      throw new CustomError("Unauthorized access", 401);
    }
    const db = getDB();
    const [rows] = await db.execute("SELECT MNE FROM numbers");

    const decryptedNumbers = (rows as blockedData[]).map(({ MNE }) =>
      decrypt(MNE),
    );

    const [data] = await db.execute("SELECT code FROM codes");

    return NextResponse.json(
      {
        data: decryptedNumbers,
        codes: (data as blockedCodes[]).map(({ code }) => code),
        error: false,
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
