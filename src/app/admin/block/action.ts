"use server";

import { db } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { getAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

export interface Data {
  type: number;
  mobileNo: string;
}

interface DataRaw {
  encrypted_number: Buffer;
  type: number;
}

export async function fetchData(
  lastId: number,
): Promise<ActionResult | Data[]> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const [rows] = (await db.execute(
    `
      SELECT
        encrypted_number,
        CASE
          WHEN blocked_by IS NULL THEN 1
          ELSE type
        END AS type
      FROM blocks
      WHERE id > ?
      ORDER BY id ASC
      LIMIT 25
    `,
    [lastId],
  )) as unknown as [DataRaw[]];

  return rows.map((r) => ({
    type: r.type,
    mobileNo: decryptFromBuffer(r.encrypted_number),
  }));
}

export async function maxPageNo(): Promise<number> {
  const [rows] = (await db.execute(
    "SELECT id FROM blocks ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}

export async function addNoAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const code = String(formData.get("code") || "").trim();
  const number = String(formData.get("number") || "").trim();

  const mobileNo = code + number;
  if (!mobileNo) return "INVALID INPUT";

  try {
    await db.execute(
      `
        INSERT INTO blocks
          (encrypted_number, hashed_number, blocked_by)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          type = 0,
          blocked_by = VALUES(blocked_by)
      `,
      [encryptToBuffer(mobileNo), hashToBuffer(mobileNo), adminId],
    );

    await sendHighPriorityAndroid();
    return "OK";
  } catch (err) {
    console.error(err);
    return "SERVER ERROR";
  }
}

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const mobile = String(formData.get("mobileNo") || "").trim();
  if (!mobile) return "INVALID INPUT";

  try {
    await db.execute(
      `
        UPDATE blocks
        SET type = 1 - type,
            blocked_by = ?
        WHERE hashed_number = ?
      `,
      [adminId, hashToBuffer(mobile)],
    );

    await sendHighPriorityAndroid();
    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}

export async function bulkUploadAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const file = formData.get("file-input");
  if (!(file instanceof File)) return "INVALID INPUT";

  try {
    const text = await file.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return "INVALID INPUT";

    const values: (Buffer | string)[] = [];
    const placeholders: string[] = [];

    for (const mobileNo of lines) {
      placeholders.push("(?, ?, ?, 0)");
      values.push(encryptToBuffer(mobileNo), hashToBuffer(mobileNo), adminId);
    }

    const sql = `
      INSERT INTO blocks
        (encrypted_number, hashed_number, blocked_by, type)
      VALUES ${placeholders.join(",")}
      ON DUPLICATE KEY UPDATE
        type = 0,
        blocked_by = VALUES(blocked_by)
    `;

    await db.execute(sql, values);

    await sendHighPriorityAndroid();
    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
