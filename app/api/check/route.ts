import { createHash } from "@/hooks/useHash";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { NextRequest, NextResponse } from "next/server";

interface clients {
  userType: number;
}

interface departments {
  department: string;
}

export async function POST(request: NextRequest) {
  try {
    const { mobileNo } = (await request.json()) as {
      mobileNo: string;
    };
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

    if (userType === 0) {
      throw new CustomError("mobileNo not allowed", 403);
    }

    if (!userType) {
      const [rows] = await db.execute("SELECT department from departments");
      return NextResponse.json(
        {
          exists: 0,
          departments: (rows as departments[]).filter(
            ({ department }) => department !== "ALL",
          ),
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ exists: 1 }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      err instanceof CustomError ? err.toJSON() : { message: "server error" },
      { status: err instanceof CustomError ? err.statusCode : 500 },
    );
  }
}
