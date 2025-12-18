"use server";

import { pool } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { verify } from "@/server/verify";
import { ActionResult, blockData } from "@/types/serverActions";
interface blockDataRaw {
  type: boolean;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
}

export async function fetchData(page: number) : Promise<ActionResult|blockData[]> {
  const verified = await verify();
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
        mobNoEn AS mobileNoEncrypted,
        mobNoHs AS mobileNohashed,
        type
     FROM blocks WHERE id > ?
     LIMIT 25 `,
    [offset]
  )) as unknown as [blockDataRaw[]];

  return rows.map((r) => ({
    mobileNohashed: Buffer.from(r.mobileNohashed).toString("base64"),
    mobileNoEncrypted: Buffer.from(r.mobileNoEncrypted).toString("base64"),
    type: r.type,
    mobNoEn: decryptFromBuffer(r.mobileNoEncrypted),
  }));
}

export async function maxPageNo() : Promise<number> {
  const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM blocks");
  const result = rows as { count: number }[];
  return Math.ceil(result[0].count / 25);
}

function normalizeMobile(code: string, number: string): string | null {
  const n = number.trim();
  if (!n) return null;
  return `${code.trim()} ${n}`.trim();
}

export async function addNoAction(
  _: string,
  formData: FormData
): Promise<ActionResult> {
  const verified = await verify();
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
  _: string,
  formData: FormData
): Promise<ActionResult> {
  const verified = await verify();
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
  _: string,
  formData: FormData
): Promise<ActionResult> {
  const verified = await verify();
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
