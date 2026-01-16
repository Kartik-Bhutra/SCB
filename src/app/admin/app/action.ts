"use server";

import { pool } from "@/db";
import { isAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

export async function fetchData(): Promise<string[] | ActionResult> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await pool.execute({
    sql: "SELECT code FROM apps",
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
    await pool.execute("INSERT IGNORE INTO apps (code) VALUES (?)", [code]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
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
    await pool.execute("DELETE FROM apps WHERE code = ?", [code]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
