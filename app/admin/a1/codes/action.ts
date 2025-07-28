"use server";

import { CustomError } from "@/lib/error";
import { messanger } from "@/lib/firebase";
import { getDB } from "@/lib/mySQL";
import { blockedCodes, ids, serverActionState } from "@/types/serverActions";
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
      `SELECT code, createdAt, blockedBy FROM codes WHERE id > ? LIMIT ${length}`,
      [id],
    );
    const [row] = await db.execute("SELECT id FROM codes LIMIT 1");
    const lastId = (row as ids[])[0];
    return {
      success: true,
      error: "",
      data: rows as blockedCodes[],
      lastPageNo: lastId ? Math.ceil(lastId.id / length) : 1,
    };
  } catch (err) {
    console.error(err);
    return {
      data: [] as blockedCodes[],
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      lastPageNo: 1,
    };
  }
}

export async function addNo(_: serverActionState, formData: FormData) {
  try {
    const { success, userId } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const number = formData.get("number")?.toString();
    const code = formData.get("code")?.toString();
    if (!number && !code) {
      throw new CustomError("Fill details", 400);
    }
    const db = getDB();
    await db.execute(
      "INSERT IGNORE INTO codes (code,blockedBy) VALUES (?,?) ",
      [number || code, userId],
    );
    await messanger.send({
      topic: "blockedUpdates",
      data: { type: "refresh_block_list" },
      android: { priority: "high" },
    });
    return {
      success: true,
      error: "",
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
    };
  }
}

export async function deleteNo(_: serverActionState, formData: FormData) {
  try {
    const { success } = await getCurrentUser();
    if (!success) throw new CustomError("Unauthorized", 401);

    const mobileNo = formData.get("mobileNo")?.toString();
    if (!mobileNo) {
      throw new CustomError("Missing mobile number", 400);
    }

    const db = getDB();

    await db.execute("DELETE FROM codes WHERE code = ?", [mobileNo]);
    await messanger.send({
      topic: "blockedUpdates",
      data: { type: "refresh_block_list" },
      android: { priority: "high" },
    });
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
