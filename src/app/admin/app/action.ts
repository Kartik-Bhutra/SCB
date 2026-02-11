"use server";

import { db } from "@/db";
import { getAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

export async function fetchData(): Promise<string[] | ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const [rows] = (await db.execute("SELECT app FROM apps")) as unknown as [
    { app: string }[],
  ];

  return rows.map((r) => r.app);
}

export async function addActionState(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const app = String(formData.get("code") || "").trim();
  if (!app) return "INVALID INPUT";

  try {
    await db.execute(
      `
        INSERT IGNORE INTO apps (app, blocked_by)
        VALUES (?, ?)
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

  const app = String(formData.get("code") || "").trim();
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
