"use server";

import { db } from "@/db";
import { isAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

export async function fetchData(): Promise<string[] | ActionResult> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await db.execute({
    sql: "SELECT code FROM codes",
    rowsAsArray: true,
  })) as unknown as [string[][]];

  return rows.map((r) => r[0]);
}

export async function addActionState(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const code = formData.get("code");

  try {
    await db.execute("INSERT IGNORE INTO codes (code) VALUES (?)", [code]);
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
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const code = formData.get("code");

  try {
    await db.execute("DELETE FROM codes WHERE code = ?", [code]);

    await sendHighPriorityAndroid();
    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
