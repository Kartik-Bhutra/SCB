"use server";

import { pool } from "@/db";
import { check } from "@/server/check";
import { ActionResult } from "@/types/serverActions";

export async function fetchData(): Promise<string[] | ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await pool.execute({
    sql: "SELECT code FROM codes",
    rowsAsArray: true,
  })) as unknown as [string[][]];

  return rows.map((r) => r[0]);
}

export async function addActionState(
  _: string,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const code = formData.get("code");

  try {
    await pool.execute("INSERT IGNORE INTO codes (code) VALUES (?)", [code]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}

export async function removeActionState(
  _: string,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(32);
  if (!verified) return "UNAUTHORIZED";

  const code = formData.get("code");

  try {
    await pool.execute("DELETE FROM codes WHERE code = ?", [code]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
