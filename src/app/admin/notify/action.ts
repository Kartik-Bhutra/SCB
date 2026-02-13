"use server";

import type { RowDataPacket } from "mysql2";
import { db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { getAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw extends RowDataPacket {
  encrypted_number: Buffer;
  app: string;
}

interface IdRow extends RowDataPacket {
  id: number;
}

export interface Data {
  app: string;
  mobileNo: string;
}

export async function fetchData(lastId: number): Promise<ActionResult | Data[]> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const lastPage = (lastId - 1) * 25;

  const [rows] = await db.execute<DataRaw[]>(
    `
      SELECT
        u.encrypted_number,
        n.app
      FROM notifications n
      JOIN users u
        ON n.hashed_number = u.hashed_number
      WHERE n.id > ?
      ORDER BY n.id ASC
      LIMIT 25
    `,
    [lastPage],
  );

  return rows.map((obj) => ({
    mobileNo: decryptFromBuffer(obj.encrypted_number),
    app: obj.app,
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = await db.execute<IdRow[]>(`SELECT id FROM notifications ORDER BY id DESC LIMIT 1`);

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}
