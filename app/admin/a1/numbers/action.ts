"use server";

import { decrypt } from "@/hooks/useXCHACHA20";
import { getDB } from "@/lib/mySQL";
import { blockedData } from "@/types/serverActions";

export default async function fetchData(page: number, length: number) {
  try {
    const db = getDB();
    const id = (page - 1) * 25;
    const [rows] = await db.execute(
      `SELECT mobileNoEncrypted, id, createdAt FROM blockedNo WHERE id > ? LIMIT ${Number(length)}`,
      [id],
    );
    const data = (rows as blockedData[]).map((row) => ({
      ...row,
      mobileNoEncrypted: decrypt(row.mobileNoEncrypted),
    }));
    return {
      success: true,
      error: "",
      data,
    };
  } catch {
    return {
      data: [] as blockedData[],
      success: false,
      error: "something went wrong",
    };
  }
}
