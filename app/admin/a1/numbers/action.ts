"use server";

import { createHash } from "@/hooks/useHash";
import { decrypt, encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { blockedData } from "@/types/serverActions";

interface ids {
  id: number;
}

export async function fetchData(page: number, length: number) {
  try {
    const db = getDB();
    const id = (page - 1) * 25;
    const [rows] = await db.execute(
      `SELECT mobileNoEncrypted, id, createdAt FROM blockedNo WHERE id > ? LIMIT ${Number(length)}`,
      [id],
    );
    const [row] = await db.execute("SELECT id from blockedNo LIMIT 1");
    const lastId = (row as ids[])[0];
    const data = (rows as blockedData[]).map((row) => ({
      ...row,
      mobileNoEncrypted: decrypt(row.mobileNoEncrypted),
    }));
    return {
      success: true,
      error: "",
      data,
      lastPageNo: lastId ? Math.ceil(lastId.id / length) : 1,
    };
  } catch (err) {
    return {
      data: [] as blockedData[],
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      lastPageNo: 1,
    };
  }
}

export async function addNo(mobileNo: string) {
  try {
    const db = getDB();
    const mobileNoHashed = createHash(mobileNo);
    const mobileNoEncrypted = encrypt(mobileNo);

    await db.execute(
      "INSERT IGNORE INTO blockedNo (mobileNoHashed, mobileNoEncrypted) VALUES (?,?) ",
      [mobileNoHashed, mobileNoEncrypted],
    );
    return {
      success: true,
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
    };
  }
}

export async function deleteNo(mobileNo: string) {
  try {
    const db = getDB();
    const mobileNoHashed = createHash(mobileNo);

    await db.execute("DELETE FROM blockedNo WHERE mobileNoHashed = ?", [
      mobileNoHashed,
    ]);

    return {
      success: true,
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
    };
  }
}
