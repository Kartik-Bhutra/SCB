"use server";

import type { RowDataPacket } from "mysql2";
import { db } from "@/db";
import { getAdmin, isAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

interface CodeRow extends RowDataPacket {
  code: string;
}

export async function fetchData(): Promise<string[] | ActionResult> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const [rows] = await db.execute<CodeRow[]>(`SELECT code FROM codes`);

  return rows.map((r) => r.code);
}

export async function addActionState(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return "INVALID INPUT";

  try {
    await db.execute(
      `
        INSERT INTO codes (code, blocked_by)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
          blocked_by = VALUES(blocked_by)

      `,
      [code, adminId],
    );

    await sendHighPriorityAndroid();

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}

export async function removeActionState(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return "INVALID INPUT";

  try {
    await db.execute(
      `
        DELETE FROM codes
        WHERE code = ?
      `,
      [code],
    );

    await sendHighPriorityAndroid();

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
