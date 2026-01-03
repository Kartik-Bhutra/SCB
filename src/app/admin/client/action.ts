"use server";

import { pool } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { check } from "@/server/check";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw {
  name: string;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
  type: number;
}

export interface Data {
  name: string;
  mobileNo: string;
  type: number;
}

export async function fetchData(page: number): Promise<ActionResult | Data[]> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
        name,
        mobNoEn AS mobileNoEncrypted,
        mobNoHs AS mobileNohashed,
        type
     FROM users
     WHERE id > ?
     LIMIT 25 `,
    [offset],
  )) as unknown as [DataRaw[]];

  return rows.map((obj) => ({
    name: obj.name,
    type: obj.type,
    mobileNo: decryptFromBuffer(obj.mobileNoEncrypted),
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = (await pool.execute(
    "SELECT id FROM users ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (rows.length === 0) return 0;

  return Math.ceil(rows[0].id / 25);
}

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const mobileType = String(formData.get("mobileType")).split(":");
  const type = Number(mobileType[1]);
  const mobileNohashed = hashToBuffer(mobileType[0]);

  try {
    await pool.execute("UPDATE users SET type = ? WHERE mobNoHs = ?", [
      type,
      mobileNohashed,
    ]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
