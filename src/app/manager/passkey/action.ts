"use server";

import { client, pool } from "@/db";
import { hashToBuffer } from "@/hooks/hash";
import { check } from "@/server/check";
import { ActionResult } from "@/types/serverActions";
import { randomBytes } from "node:crypto";

export interface Data {
  userId: string;
  sessionId: string | null;
}

export async function fetchData(): Promise<Data[] | ActionResult> {
  const verified = await check(16);
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await pool.execute({
    sql: `SELECT userId FROM admins WHERE type = 1`,
    rowsAsArray: true,
  })) as unknown as [string[][]];

  const data: Data[] = await Promise.all(
    rows.map(async (r) => {
      const userId = r[0];
      const key = hashToBuffer(userId).toString("hex");

      return {
        userId,
        sessionId: await client.get(key),
      };
    })
  );

  return data;
}

export async function generateSession(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(16);
  if (!verified) return "UNAUTHORIZED";

  const userId = String(formData.get("userId"));
  const key = hashToBuffer(userId).toString("hex");
  const session = randomBytes(4).toString("hex");

  await client.set(key, session);
  await client.expire(key, 60 * 10);
  return "OK";
}

export async function deleteSession(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const verified = await check(16);
  if (!verified) return "UNAUTHORIZED";

  const userId = String(formData.get("userId"));
  const key = hashToBuffer(userId).toString("hex");

  await client.del(key);
  return "OK";
}
