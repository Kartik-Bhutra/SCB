"use server";

import type { RowDataPacket } from "mysql2";
import { db } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { getAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw extends RowDataPacket {
  encrypted_number: Buffer;
  type: number;
}

interface IdRow extends RowDataPacket {
  id: number;
}

export interface Data {
  type: number;
  mobileNo: string;
}

export async function fetchData(lastId: number): Promise<ActionResult | Data[]> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const lastPage = (lastId - 1) * 25;

  const [rows] = await db.execute<DataRaw[]>(
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
    [lastPage],
  );

  return rows.map((r) => ({
    type: r.type,
    mobileNo: decryptFromBuffer(r.encrypted_number),
  }));
}

export async function maxPageNo(): Promise<number> {
  const [rows] = await db.execute<IdRow[]>(`SELECT id FROM blocks ORDER BY id DESC LIMIT 1`);

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}

export async function addNoAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const code = String(formData.get("code") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();

  if (!code || !number) return "INVALID INPUT";

  const mobileNo = code + number;

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
  } catch {
    return "SERVER ERROR";
  }
}

export async function changeTypeAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const mobile = String(formData.get("mobileNo") ?? "").trim();
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

export async function bulkUploadAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
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

    if (!lines.length) return "INVALID INPUT";

    const placeholders: string[] = [];
    const values: (Buffer | string)[] = [];

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
