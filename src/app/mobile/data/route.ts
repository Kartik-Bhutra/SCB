import { client, pool } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await req.text();

    if (!token || token.length < 80) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key = token.slice(0, 80);
    const value = token.slice(80);

    const stored = await client.get(key);
    if (!stored || stored !== value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [blockRows] = (await pool.execute({
      sql: `SELECT mobNoEn FROM blocks`,
      rowsAsArray: true,
    })) as unknown as [Buffer[][]];

    const [codeRows] = (await pool.execute({
      sql: `SELECT code FROM codes`,
      rowsAsArray: true,
    })) as unknown as [string[][]];

    const blocks = blockRows.map(([mobNoEn]) => decryptFromBuffer(mobNoEn));

    const codes = codeRows.map(([code]) => code);

    return NextResponse.json({
      blocks,
      codes,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
