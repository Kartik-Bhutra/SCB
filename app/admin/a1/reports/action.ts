"use server";

import { createHash } from "@/hooks/useHash";
import { decrypt, encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { ids, reportsData, serverActionState } from "@/types/serverActions";
import { getCurrentUser } from "@/utils/adminActions";

export async function fetchData(page: number, length: number) {
  try {
    const { success } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const db = getDB();
    const id = (page - 1) * 25;
    const [rows] = await db.execute(
      `SELECT MNE, RMNE FROM reports WHERE id > ? AND stat = 1 LIMIT ${length}`,
      [id],
    );
    const [row] = await db.execute("SELECT id FROM numbers LIMIT 1");
    const lastId = (row as ids[])[0];
    const data = (rows as reportsData[]).map(({ MNE, RMNE }) => ({
      MNE: decrypt(MNE),
      RMNE: decrypt(RMNE),
    }));
    return {
      success: true,
      error: "",
      data,
      lastPageNo: lastId ? Math.ceil(lastId.id / length) : 1,
    };
  } catch (err) {
    return {
      data: [] as reportsData[],
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      lastPageNo: 1,
    };
  }
}

export async function approveNo(_: serverActionState, formData: FormData) {
  try {
    const { success, userId } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const number = formData.get("mobileNo")?.toString();
    if (!number) {
      throw new CustomError("Fill details", 400);
    }
    const db = getDB();
    const MNH = createHash(number);
    await db.execute(
      "UPDATE reports SET stat = 2, blockedBy = ? WHERE MNH = ?",
      [userId, MNH],
    );
    await db.execute(
      "INSERT IGNORE INTO numbers (MNH, MNE,blockedBy) VALUES (?,?,?) ",
      [MNH, encrypt(number), userId],
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

export async function removeNo(_: serverActionState, formData: FormData) {
  try {
    const { success, userId } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const number = formData.get("mobileNo")?.toString();
    if (!number) {
      throw new CustomError("Fill details", 400);
    }
    const db = getDB();
    const MNH = createHash(number);
    await db.execute(
      "UPDATE reports SET stat = 0, blockedBy = ? WHERE MNH = ?",
      [userId, MNH],
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
