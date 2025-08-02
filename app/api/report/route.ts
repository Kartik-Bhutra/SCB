import { createHash } from "@/hooks/useHash";
import { decrypt, encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { auth } from "@/lib/firebase";
import { getDB } from "@/lib/mySQL";
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
}

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as token;
    if (!token) {
      throw new CustomError("Fill user details", 400);
    }
    const decoded = await auth.verifyIdToken(token);
    const { phone_number } = decoded;
    if (!phone_number) {
      throw new CustomError("Invalid credentials", 401);
    }
    const MNH = createHash(phone_number);
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
    const { token, mobileNo } = (await request.json()) as add;
    if (!token || !mobileNo) {
      throw new CustomError("Fill user details", 400);
    }
    const decoded = await auth.verifyIdToken(token);
    const { phone_number } = decoded;
    if (!phone_number) {
      throw new CustomError("Invalid credentials", 401);
    }
    const MNH = createHash(phone_number);
    const db = getDB();
    await db.execute("INSERT INTO reports(MNE,RMNH,RMNE) VALUES(?,?,?)", [
      encrypt(mobileNo),
      MNH,
      encrypt(phone_number),
    ]);
    return NextResponse.json({ message: "OK", error: false }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
