import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";

export async function GET(req: NextRequest) {
  try {
    const fromTime = await req.text();

    if (!fromTime) {
      return NextResponse.json({ error: "Missing fromTime" }, { status: 400 });
    }

    const date = new Date(fromTime);
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
    )) as unknown as [[Buffer, boolean][]];

    const data = rows.map(([mobNoEn, type]) => ({
      mobNo: decryptFromBuffer(mobNoEn),
      type,
    }));

    const [codeRows] = (await pool.execute({
      sql: `SELECT code FROM codes`,
      rowsAsArray: true,
    })) as unknown as [string[][]];

    const codes = codeRows.map(([code]) => code);

    return NextResponse.json({ data, codes }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
