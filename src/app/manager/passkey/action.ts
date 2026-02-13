"use server";

import { randomBytes } from "node:crypto";
import { db, redis } from "@/db";
import { hashToBuffer } from "@/hooks/hash";
import { isManager } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

export interface Data {
  userId: string;
  sessionId: string | null;
}

export async function fetchData(): Promise<Data[] | ActionResult> {
  const verified = await isManager();
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await db.execute({
    sql: `SELECT admin_id FROM admins WHERE type = 1`,
    rowsAsArray: true,
  })) as unknown as [string[][]];

  const data: Data[] = await Promise.all(
    rows.map(async (r) => {
      const userId = r[0];
      const key = hashToBuffer(userId).toString("base64url");
      const sessionId = await redis.get(key);
      return {
        userId,
        sessionId: !sessionId || sessionId.length === 8 ? sessionId : null,
      };
    }),
  );

  return data;
}

export async function generateSession(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const verified = await isManager();
  if (!verified) return "UNAUTHORIZED";

  const userId = String(formData.get("userId"));
  const key = hashToBuffer(userId).toString("base64url");
  const session = randomBytes(4).toString("hex");

  await redis.set(key, session, {
    expiration: {
      type: "EX",
      value: 600,
    },
  });
  return "OK";
}

export async function deleteSession(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const verified = await isManager();
  if (!verified) return "UNAUTHORIZED";

  const userId = String(formData.get("userId"));
  const key = hashToBuffer(userId).toString("base64url");

  await redis.del(key);
  return "OK";
}
