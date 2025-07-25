import { createHash } from "@/hooks/useHash";
import { encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { randomUUID } from "crypto";
import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";

interface register {
  token: string;
  username?: string;
  department?: string;
}

interface clients {
  userType: number;
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const { token, department, username } = (await request.json()) as register;
    if (!token) {
      throw new CustomError("Fill user details", 400);
    }
    const decoded = await auth.verifyIdToken(token);
    const { uid, phone_number } = decoded;
    if (!phone_number) {
      throw new CustomError("Invalid credentials", 401);
    }
    const sid = randomUUID();
    await auth.setCustomUserClaims(uid, { sid });
    const db = getDB();
    const MNH = createHash(phone_number);
    const [rows] = await db.execute(
      "SELECT userType FROM clients WHERE MNH = ?",
      [MNH],
    );

    const userType = (rows as clients[] | undefined[])[0]?.userType;

    if (!userType) {
      const MNE = encrypt(phone_number);
      await db.execute(
        "INSERT INTO clients (MNH, MNE, username, token, department)",
        [MNH, MNE, username || "N/A", sid, department || "N/A"],
      );
    }

    if (userType === 0) {
      throw new CustomError("mobileNo not allowed", 401);
    }

    await redis.json.set(MNH, "$", {
      userType: userType || 1,
      token: sid,
    });

    await redis.expire(MNH, 60 * 60 * 24);

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
