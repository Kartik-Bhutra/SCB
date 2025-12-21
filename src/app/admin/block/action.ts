"use server";

import { pool } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { check } from "@/server/check";
import { ActionResult } from "@/types/serverActions";

interface DataRaw {
  type: boolean;
  mobileNoHashed: Buffer;
  mobileNoEncrypted: Buffer;
}

export interface Data {
  type: boolean;
  mobileNo: string;
}

export async function fetchData(page: number): Promise<ActionResult | Data[]> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
        mobNoEn AS mobileNoEncrypted,
        mobNoHs AS mobileNoHashed,
        type
     FROM blocks WHERE id > ?
     LIMIT 25 `,
    [offset]
  )) as unknown as [DataRaw[]];

  return rows.map((r) => ({
    type: r.type,
    mobileNo: decryptFromBuffer(r.mobileNoEncrypted),
  }));
}

export async function maxPageNo(): Promise<number> {
  const [rows] = await pool.execute(
    "SELECT id FROM blocks ORDER BY id DESC LIMIT 1"
  );

  const result = rows as { id: number }[];

  if (result.length === 0) return 0;

  return Math.ceil(result[0].id / 25);
}

export async function addNoAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const code = formData.get("code");
  const number = String(formData.get("number"));

  const mobileNo = code + number;
  if (!mobileNo) return "INVALID_INPUT";

  try {
    await pool.execute(
      `INSERT INTO blocks (mobNoEn, mobNoHs)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE type = 0`,
      [encryptToBuffer(mobileNo), hashToBuffer(mobileNo)]
    );
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const mobile = String(formData.get("mobileNo"));
  try {
    await pool.execute("UPDATE blocks SET type = 1 - type WHERE mobNoHs = ?", [
      hashToBuffer(mobile),
    ]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}

export async function bulkUploadAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const file = formData.get("file-input");
  if (!(file instanceof File)) return "INVALID_INPUT";

  try {
    const text = await file.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return "INVALID_INPUT";

    const values: Buffer[] = [];
    const placeholders: string[] = [];

    for (const mobileNo of lines) {
      placeholders.push("(?, ?, 0)");
      values.push(encryptToBuffer(mobileNo), hashToBuffer(mobileNo));
    }

    const sql = `
      INSERT INTO blocks (mobNoEn, mobNoHs, type)
      VALUES ${placeholders.join(",")}
      ON DUPLICATE KEY UPDATE type = 0
    `;

    await pool.execute(sql, values);

    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
