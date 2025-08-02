"use server";

import { createHash } from "@/hooks/useHash";
import { decrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import redis from "@/lib/redis";
import { clientData, ids, serverActionState } from "@/types/serverActions";
import { getCurrentUser } from "@/utils/adminActions";

export async function fetchData(
  page: number,
  length: number,
  userType: number,
) {
  try {
    const { success, department } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const db = getDB();
    const id = (page - 1) * 25;
    const [rows] = await db.execute(
      `SELECT MNE, username FROM clients WHERE id > ? and department = ? and userType = ? LIMIT ${length}`,
      [id, department, userType],
    );
    const data = (rows as clientData[]).map((row) => ({
      ...row,
      MNE: decrypt(row.MNE),
    }));
    const [row] = await db.execute(
      "SELECT id FROM clients where department = ? and userType = 1 LIMIT 1",
      [department],
    );
    const lastId = (row as ids[])[0];
    return {
      success: true,
      error: "",
      data,
      lastPageNo: lastId ? Math.ceil(lastId.id / length) : 1,
    };
  } catch (err) {
    return {
      data: [] as clientData[],
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
      "UPDATE clients SET userType = 2, authBy = ? WHERE MNH = ?",
      [userId, MNH],
    );
    try {
      await redis.json.set(MNH, "$.userType", 2);
    } catch {}
    return {
      success: true,
      error: "",
    };
  } catch (err) {
    console.error(err)
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
      "UPDATE clients SET userType = 0, authBy = ? WHERE MNH = ?",
      [userId, MNH],
    );
    try {
      await redis.json.set(MNH, "$.userType", 0);
    } catch {}
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

export async function makeNormal(_: serverActionState, formData: FormData) {
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
      "UPDATE clients SET userType = 1, authBy = ? WHERE MNH = ?",
      [userId, MNH],
    );
    try {
      await redis.json.set(MNH, "$.userType", 1);
    } catch {}
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
