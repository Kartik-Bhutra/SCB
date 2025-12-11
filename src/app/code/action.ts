"use server";

import { pool } from "@/db";
import { verify } from "@/server/verify";

export async function getData() {
  const verified = verify();
  if (!verified) {
    return "Unauthorized";
  }

  const [rows] = (await pool.execute({
    sql: `SELECT code FROM codes`,
    rowsAsArray: true,
  })) as unknown as [string[][]];

  return rows.map((r) => r[0]);
}

export async function add(code: string) {
  const verified = verify();
  if (!verified) {
    return "Unauthorized";
  }

  await pool.execute(`INSERT IGNORE INTO codes (code) VALUES (?)`, [code]);
}

export async function remove(code: string) {
  const verified = verify();
  if (!verified) {
    return "Unauthorized";
  }

  await pool.execute(`DELETE FROM codes WHERE code = ?`, [code]);
}
