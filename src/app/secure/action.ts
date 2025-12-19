"use server";

import { cookies } from "next/headers";
import { verify } from "argon2";
import { randomBytes } from "crypto";
import { client, pool } from "@/db";
import { hashToBuffer } from "@/hooks/hash";

export async function serverAction(_: string, formData: FormData) {
  try {
    const userId = String(formData.get("userId"));
    const plainPassword = String(formData.get("password"));

    if (!userId || !plainPassword) {
      return "Enter credentials";
    }

    const [rows] = (await pool.execute(
      {
        sql: `SELECT passHash FROM admins WHERE userId = ? AND type = 0 LIMIT 1`,
        rowsAsArray: true,
      },
      [userId]
    )) as unknown as [string[][]];

    if (rows.length !== 1) {
      return "Invalid credentials";
    }

    const [storedPasswordHash] = rows[0];

    const isPasswordValid = await verify(storedPasswordHash, plainPassword);
    if (!isPasswordValid) {
      return "Invalid credentials";
    }

    const sessionId = randomBytes(8).toString("hex");
    const userHash = hashToBuffer(userId).toString("base64");
    const sessionToken = userHash + sessionId;

    const redisStatus = await client.set(userHash, sessionId);
    if (redisStatus !== "OK") {
      return "Error occured";
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
    return "Error occured";
  }
}
