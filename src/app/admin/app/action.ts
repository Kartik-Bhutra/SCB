"use server";

import type { RowDataPacket } from "mysql2";
import { db } from "@/db";
import { getAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

interface AppRow extends RowDataPacket {
  app: string;
}

export async function fetchData(): Promise<string[] | ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const [rows] = await db.execute<AppRow[]>(`SELECT app FROM apps`);

  return rows.map((r) => r.app);
}

export async function addActionState(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const app = String(formData.get("app") ?? "").trim();
  if (!app) return "INVALID INPUT";

  try {
    await db.execute(
      `
        INSERT INTO apps (app, blocked_by)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          blocked_by = VALUES(blocked_by)
      `,
      [app, adminId],
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

  const app = String(formData.get("app") ?? "").trim();
  if (!app) return "INVALID INPUT";

  try {
    await db.execute(
      `
        DELETE FROM apps
        WHERE app = ?
      `,
      [app],
    );

    await sendHighPriorityAndroid();
    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
