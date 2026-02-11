"use server";

import { hash, verify } from "@node-rs/argon2";
import { db } from "@/db";
import { passwordActionResult } from "@/types/serverActions";

export async function serverAction(
  _: passwordActionResult,
  formData: FormData,
): Promise<passwordActionResult> {
  try {
    const userId = String(formData.get("userId") || "");
    const password = String(formData.get("password") || "");
    const newPassword = String(formData.get("newPassword") || "");

    if (!userId || !password || !newPassword) {
      return "INVALID INPUT";
    }

    if (password == newPassword) {
      return "INVALID_PASSWORD";
    }

    const [rows] = (await db.execute(
      {
        sql: `
          SELECT passHash
          FROM admins
          WHERE userId = ? LIMIT 1
        `,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    if (!rows.length) return "INVALID CREDENTIALS";

    if (!(await verify(rows[0][0], password))) {
      return "INVALID CREDENTIALS";
    }

    await db.execute(
      `
        UPDATE admins
        SET passHash = ?
        WHERE userId = ?
        LIMIT 1
      `,
      [await hash(newPassword), userId],
    );

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
