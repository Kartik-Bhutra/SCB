"use server";

import { db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { getAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw {
  encrypted_number: Buffer;
  app: string;
}

export interface Data {
  app: string;
  mobileNo: string;
}

export async function fetchData(
  lastId: number,
): Promise<ActionResult | Data[]> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const [rows] = (await db.execute(
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
    [lastId],
  )) as unknown as [DataRaw[]];

  return rows.map((obj) => ({
    mobileNo: decryptFromBuffer(obj.encrypted_number),
    app: obj.app,
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = (await db.execute(
    "SELECT id FROM notifications ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}
