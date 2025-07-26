import { createHash } from "@/hooks/useHash";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { NextRequest, NextResponse } from "next/server";

interface check {
  mobileNo: string;
}

interface clients {
  userType: number;
}

interface departments {
  department: string;
}

export async function POST(request: NextRequest) {
  try {
    const { mobileNo } = (await request.json()) as check;
    if (!mobileNo) {
      throw new CustomError("Fill user details", 400);
    }
    const MNH = createHash(mobileNo);
    const db = getDB();
    const [rows] = await db.execute(
      `SELECT userType FROM clients WHERE MNH = ?`,
      [MNH],
    );

    const userType = (rows as clients[] | undefined[])[0]?.userType;

    if (!userType) {
      const [rows] = await db.execute("SELECT departments from departments");
      return NextResponse.json(
        {
          message: "OK",
          exists: 0,
          departments: (rows as departments[]).map(
            ({ department }) => department,
          ),
        },
        { status: 200 },
      );
    }

    if (userType === 0) {
      throw new CustomError("mobileNo not allowed", 401);
    }

    return NextResponse.json({ message: "OK", exists: 1 }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
