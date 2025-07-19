"use server";

import { createHash } from "@/hooks/useHash";
import { decrypt, encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { blockedData, serverActionState } from "@/types/serverActions";
import { getCurrentUser } from "@/utils/userActions";

interface ids {
  id: number;
}

export async function fetchData(page: number, length: number) {
  try {
    const { success } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const db = getDB();
    const id = (page - 1) * 25;
    const [rows] = await db.execute(
      `SELECT MNE, createdAt,blockedBy FROM numbers WHERE id > ? LIMIT ${length}`,
      [id],
    );
    const [row] = await db.execute("SELECT id from numbers LIMIT 1");
    const lastId = (row as ids[])[0];
    const data = (rows as blockedData[]).map((row) => ({
      ...row,
      MNE: decrypt(row.MNE),
    }));
    return {
      success: true,
      error: "",
      data,
      lastPageNo: lastId ? Math.ceil(lastId.id / length) : 1,
    };
  } catch (err) {
    console.error(err);
    return {
      data: [] as blockedData[],
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
    const code = formData.get("code")?.toString();
    const number = formData.get("number")?.toString().split("-").join("");
    if (!code || !number) {
      throw new CustomError("Fill details", 400);
    }
    const mobileNo = code + number;
    const db = getDB();
    const MNH = createHash(mobileNo);
    const MNE = encrypt(mobileNo);
    await db.execute(
      "INSERT IGNORE INTO numbers (MNH, MNE,blockedBy) VALUES (?,?,?) ",
      [MNH, MNE, userId],
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

export async function deleteNo(_: serverActionState, formData: FormData) {
  try {
    const { success } = await getCurrentUser();
    if (!success) throw new CustomError("Unauthorized", 401);

    const mobileNo = formData.get("mobileNo")?.toString();
    if (!mobileNo) {
      throw new CustomError("Missing mobile number", 400);
    }

    const db = getDB();
    const MNH = createHash(mobileNo);

    await db.execute("DELETE FROM numbers WHERE MNH = ?", [MNH]);

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

export async function bulkUpload(_: serverActionState, formData: FormData) {
  console.log(formData);
  return {
    success: false,
    error: "",
  };
}
