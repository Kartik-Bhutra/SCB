"use server";

import { randomBytes } from "node:crypto";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { client, pool } from "@/db";
import { hashToBuffer } from "@/hooks/hash";
import type { ActionResult } from "@/types/serverActions";

export async function serverAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = String(formData.get("userId"));
    const plainPassword = String(formData.get("password"));

    if (!userId || !plainPassword) {
      return "INVALID_INPUT";
    }

    const [rows] = (await pool.execute(
      {
        sql: `SELECT passHash FROM admins WHERE userId = ? AND type = 0 LIMIT 1`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    if (rows.length !== 1) {
      return "INVALID_CREDENTIALS";
    }

    const [storedPasswordHash] = rows[0];

    const isPasswordValid = await verify(storedPasswordHash, plainPassword);
    if (!isPasswordValid) {
      return "INVALID_CREDENTIALS";
    }

    const sessionId = randomBytes(8).toString("hex");
    const userHash = hashToBuffer(userId).toString("base64");
    const sessionToken = userHash + sessionId;

    const redisStatus = await client.set(userHash, sessionId);
    if (redisStatus !== "OK") {
      return "INTERNAL_ERROR";
    }

    await client.expire(userHash, 60 * 60 * 24);

    const cookieStore = await cookies();
    cookieStore.set("token", sessionToken, {
      maxAge: 60 * 60 * 24,
      // httpOnly: true,
      // secure: true,
      // sameSite: "strict",
      // path: "/",
    });

    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
