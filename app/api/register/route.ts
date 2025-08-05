import { createHash } from "@/hooks/useHash";
import { encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { auth } from "@/lib/firebase";
import { getDB } from "@/lib/mySQL";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

interface register {
  token: string;
  username?: string;
  department?: string;
}

interface clients {
  userType: number;
  username: string;
  department: string;
}

export async function POST(request: NextRequest) {
  try {
    let { token, department, username } = (await request.json()) as register;
    if (!token) {
      throw new CustomError("Fill user details", 400);
    }

    const decoded = await auth.verifyIdToken(token);
    const { phone_number } = decoded;

    if (!phone_number) {
      throw new CustomError("Invalid credentials", 401);
    }

    const sid = randomUUID();
    const MNH = createHash(phone_number);

    token = MNH + ":" + sid;

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT userType, username, department FROM clients WHERE MNH = ?",
      [MNH],
    );

    const userType = (rows as clients[] | undefined[])[0]?.userType;

    username = (rows as clients[] | undefined[])[0]?.username || username;
    department = (rows as clients[] | undefined[])[0]?.department || department;

    if (userType === 0) {
      throw new CustomError("mobileNo not allowed", 403);
    }

    if (!userType) {
      const MNE = encrypt(phone_number);
      await db.execute(
        "INSERT INTO clients (MNH, MNE, username, token, department) VALUES (?, ?, ?, ?, ?)",
        [MNH, MNE, username || "N/A", sid, department || "N/A"],
      );
    } else {
      await db.execute("UPDATE clients SET token = ? WHERE MNH = ?", [
        sid,
        MNH,
      ]);
    }
    return NextResponse.json(
      {
        message: "OK",
        userType: userType || 1,
        token,
        username: username || "N/A",
        department: department || "N/A",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
