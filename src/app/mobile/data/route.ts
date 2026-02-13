import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";

interface BlockRow extends RowDataPacket {
  encrypted_number: Buffer;
  type: number;
}

interface CodeRow extends RowDataPacket {
  code: string;
}

interface AppRow extends RowDataPacket {
  app: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const formTime = body?.formTime;

    if (!formTime) {
      return NextResponse.json({ error: "Missing formTime" }, { status: 400 });
    }

    const date = new Date(formTime);

    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid time format" }, { status: 400 });
    }

    const [blockRows] = await db.execute<BlockRow[]>(
      `
        SELECT encrypted_number, type
        FROM blocks
        WHERE updated_at > ?
        ORDER BY updated_at ASC
      `,
      [date],
    );

    const blocked: string[] = [];
    const unBlocked: string[] = [];

    for (const row of blockRows) {
      const mobileNo = decryptFromBuffer(row.encrypted_number);

      if (row.type === 1) {
        blocked.push(mobileNo);
      } else {
        unBlocked.push(mobileNo);
      }
    }

    const [codeRows] = await db.execute<CodeRow[]>(`SELECT code FROM codes`);

    const codes = codeRows.map((r) => r.code);

    const [appRows] = await db.execute<AppRow[]>(`SELECT app FROM apps`);

    const apps = appRows.map((r) => r.app);

    return NextResponse.json({ blocked, unBlocked, codes, apps }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
