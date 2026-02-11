"use server";

import { db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { isAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw {
  mobileNoEncrypted: Buffer;
  code: string;
}

export interface Data {
  code: string;
  mobileNo: string;
}

export async function fetchData(page: number): Promise<ActionResult | Data[]> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await db.execute(
    `SELECT 
        mobNoEn AS mobileNoEncrypted,
        code
     FROM notify
     WHERE id > ?
     LIMIT 25 `,
    [offset],
  )) as unknown as [DataRaw[]];

  return rows.map((obj) => ({
    mobileNo: decryptFromBuffer(obj.mobileNoEncrypted),
    code: obj.code,
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = (await db.execute(
    "SELECT id FROM notify ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (rows.length === 0) return 0;

  return Math.ceil(rows[0].id / 25);
}
