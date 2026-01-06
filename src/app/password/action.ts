"use server";

import { hash, verify } from "@node-rs/argon2";
import { pool } from "@/db";
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
      return "INVALID_INPUT";
    }

    if (password == newPassword) {
      return "INVALID_PASSWORD";
    }

    const [rows] = (await pool.execute(
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

    if (!rows.length) return "INVALID_CREDENTIALS";

    if (!(await verify(rows[0][0], password))) {
      return "INVALID_CREDENTIALS";
    }

    await pool.execute(
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
    return "INTERNAL_ERROR";
  }
}
