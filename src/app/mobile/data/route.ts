import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
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

    const [rows] = (await pool.execute(
      {
        sql: `
          SELECT mobNoEn, type
          FROM blocks
          WHERE updated_at > ?
        `,
        rowsAsArray: true,
      },
      [date],
    )) as unknown as [[Buffer, number][]];

    const blocked: string[] = [];
    const unBlocked: string[] = [];

    for (const [mobNoEn, type] of rows) {
      const mobNo = decryptFromBuffer(mobNoEn);

      if (type === 1) {
        unBlocked.push(mobNo);
      } else {
        blocked.push(mobNo);
      }
    }

    const [codeRows] = (await pool.execute({
      sql: `SELECT code FROM codes`,
      rowsAsArray: true,
    })) as unknown as [string[][]];

    const codes = codeRows.map(([code]) => code);

    const [appRows] = (await pool.execute({
      sql: `SELECT code FROM apps`,
      rowsAsArray: true,
    })) as unknown as [string[][]];

    const apps = appRows.map(([code]) => code);

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
