"use server";

import { hash, verify } from "@node-rs/argon2";
import type { RowDataPacket } from "mysql2";
import { db } from "@/db";
import type { passwordActionResult } from "@/types/serverActions";

interface AdminRow extends RowDataPacket {
  hashed_password: string;
}

export async function serverAction(
  _: passwordActionResult,
  formData: FormData,
): Promise<passwordActionResult> {
  try {
    const adminId = String(formData.get("userId") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");

    if (!adminId || !password || !newPassword) {
      return "INVALID INPUT";
    }

    if (password === newPassword) {
      return "INVALID_PASSWORD";
    }

    if (newPassword.length < 8) {
      return "INVALID_PASSWORD";
    }

    const [rows] = await db.execute<AdminRow[]>(
      `
        SELECT hashed_password
        FROM admins
        WHERE admin_id = ?
        LIMIT 1
      `,
      [adminId],
    );

    if (!rows.length) return "INVALID CREDENTIALS";

    const valid = await verify(rows[0].hashed_password, password);
    if (!valid) return "INVALID CREDENTIALS";

    const newHash = await hash(newPassword);

    await db.execute(
      `
        UPDATE admins
        SET hashed_password = ?
        WHERE admin_id = ?
        LIMIT 1
      `,
      [newHash, adminId],
    );

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
