"use server";

import { client, pool } from "@/db";
import { check } from "@/server/check";
import { ActionResult } from "@/types/serverActions";
import { randomBytes } from "node:crypto";

export async function fetchData(): Promise<string[] | ActionResult> {
  const verified = await check(16);
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await pool.execute({
    sql: `SELECT userId FROM admins WHERE type = 1`,
    rowsAsArray: true,
  })) as unknown as [string[][]];

  return rows.map((r) => r[0]);
}

export async function generateSession(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(16);
  if (!verified) return "UNAUTHORIZED";

  const userId = String(formData.get("userId"));
  const session = randomBytes(8).toString("hex");

  await client.set(userId, session);
  return "OK";
}
