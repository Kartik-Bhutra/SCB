"use server";

import { decrypt } from "@/hooks/useXCHACHA20";
import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";
import { clientData, ids, serverActionState } from "@/types/serverActions";
import { getCurrentUser } from "@/utils/userActions";

export async function fetchData(page: number, length: number) {
  try {
    const { success, department } = await getCurrentUser();
    if (!success) {
      throw new CustomError("Unauthorized", 401);
    }
    const db = getDB();
    const id = (page - 1) * 25;
    const [rows] = await db.execute(
      `SELECT MNE, username FROM clients WHERE id > ? and department = ? and userType = 1 LIMIT ${length}`,
      [id, department],
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
    console.error(err);
    return {
      data: [] as clientData[],
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      lastPageNo: 1,
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
