"use server";

import { pool } from "@/db";
import { verify } from "@/server/verify";
import { serverActionState } from "@/types/serverActions";
export async function fetchData() {
  const verified =await verify();
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
  const verified =await verify();
  if (!verified) {
    return "Unauthorized";
  }

  await pool.execute(`INSERT IGNORE INTO codes (code) VALUES (?)`, [code]);
}

export async function remove(code: string) {
  const verified =await verify();
  if (!verified) {
    return "Unauthorized";
  }

  await pool.execute(`DELETE FROM codes WHERE code = ?`, [code]);
}

export async function addActionState(_: serverActionState, formData: FormData): Promise<serverActionState> {
  try {
    const code = formData.get("code");
    if (typeof code !== "string") {
      return { success: false, error: "Invalid code format" };
    }

    await add(code);
    return { success: true ,error:""};
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}
export async function removeActionState(_: serverActionState, formData: FormData): Promise<serverActionState> {
  try {
    const code = formData.get("code");
    if (typeof code !== "string") {
      return { success: false, error: "Invalid code format" };
    }

    await remove(code);
    return { success: true ,error:""};
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}