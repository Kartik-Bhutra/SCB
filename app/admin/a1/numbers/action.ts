"use server";

import { createHash } from "@/hooks/useHash";
import { decrypt, encrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { messanger } from "@/lib/firebase";
import { getDB } from "@/lib/mySQL";
import { blockedData, ids, serverActionState } from "@/types/serverActions";
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
      `SELECT MNE, createdAt,blockedBy FROM numbers WHERE id > ? LIMIT ${length}`,
      [id],
    );
    const [row] = await db.execute("SELECT id FROM numbers LIMIT 1");
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
    const number = formData.get("number")?.toString();
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

export async function bulkUpload(_: serverActionState, formData: FormData) {
  try {
    const { success, userId } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }

    const file = formData.get("file-input");

    if (!(file instanceof File) || !file.type.startsWith("text/")) {
      throw new CustomError("Please upload a valid text file.", 400);
    }

    const text = await file.text();
    const rawList = text
      .split(/[\n, ]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    const validNumbers: string[] = [];
    rawList.forEach((num) => {
      let processedNum: string | null = null;
      if (num.startsWith("+")) {
        if (/^\+\d+$/.test(num)) {
          processedNum = num;
        }
      } else {
        if (/^\d+$/.test(num)) {
          processedNum = `+91${num}`;
        }
      }
      if (processedNum) {
        validNumbers.push(processedNum);
      }
    });

    if (validNumbers.length === 0) {
      throw new CustomError("No valid numbers found in the file.", 400);
    }

    const insertData = validNumbers.map((number) => [
      createHash(number),
      encrypt(number),
      userId,
    ]);

    const db = getDB();

    await db.query(
      "INSERT INTO numbers (MNH, MNE, blockedBy) VALUES ? ON DUPLICATE KEY UPDATE MNE = VALUES(MNE), blockedBy = VALUES(blockedBy)",
      [insertData],
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
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "Something went wrong.",
    };
  }
}
