import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";

export async function POST(req: NextRequest) {
  try {
    const { formTime } = await req.json();

    if (!formTime) {
      return NextResponse.json({ error: "Missing formTime" }, { status: 400 });
    }

    const date = new Date(formTime);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid time format" },
        { status: 400 },
      );
    }

    const [rows] = (await db.execute(
      `
        SELECT encrypted_number, type
        FROM blocks
        WHERE updated_at > ?
        ORDER BY updated_at ASC
      `,
      [date],
    )) as unknown as [{ encrypted_number: Buffer; type: number }[]];

    const blocked: string[] = [];
    const unBlocked: string[] = [];

    for (const row of rows) {
      const mobileNo = decryptFromBuffer(row.encrypted_number);

      if (row.type === 1) {
        blocked.push(mobileNo);
      } else {
        unBlocked.push(mobileNo);
      }
    }

    const [codeRows] = (await db.execute(
      `SELECT code FROM codes`,
    )) as unknown as [{ code: string }[]];

    const codes = codeRows.map((r) => r.code);

    const [appRows] = (await db.execute(`SELECT app FROM apps`)) as unknown as [
      { app: string }[],
    ];

    const apps = appRows.map((r) => r.app);

    return NextResponse.json(
      { blocked, unBlocked, codes, apps },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
