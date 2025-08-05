import { createHash } from "@/hooks/useHash";
import { decrypt, encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { mobileAuth } from "@/utils/clientAction";
import { NextRequest, NextResponse } from "next/server";

interface token {
  token: string;
}

interface readReport {
  MNE: string;
  stat: number;
}

interface add extends token {
  mobileNo: string;
  phone_number: string;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as token;
    if (!token) {
      throw new CustomError("Fill user details", 400);
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
    const [MNH] = token.split(":");
    const db = getDB();
    const [result] = await db.execute(
      "SELECT MNE, stat FROM reports WHERE RMNH = ?",
      [MNH],
    );
    const data = (result as readReport[]).map((row) => ({
      ...row,
      MNE: decrypt(row.MNE),
    }));
    return NextResponse.json(
      { message: "OK", error: false, data },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { token, mobileNo, phone_number } = (await request.json()) as add;
    if (!token || !mobileNo || !phone_number) {
      throw new CustomError("Fill user details", 400);
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
    const MNH = createHash(phone_number);
    const db = getDB();
    await db.execute("INSERT INTO reports(MNE,RMNH,RMNE,MNH) VALUES(?,?,?,?)", [
      encrypt(mobileNo),
      MNH,
      encrypt(phone_number),
      createHash(mobileNo),
    ]);
    return NextResponse.json({ message: "OK", error: false }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
