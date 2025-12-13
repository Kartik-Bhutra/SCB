"use server";

import { pool } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { verify } from "@/server/verify";
import { blockData, serverActionState } from "@/types/serverActions";
// 0 -> blocked , 1 -> not blocked

interface blockDataRaw {
  type: boolean;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
}
export async function fetchData(page: number) {
  const verified = await verify();
  if (!verified) return "Unauthorized";

  const id = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
        mobNoEn as mobileNoEncrypted,
        mobNoHs as mobileNohashed,
        type
     FROM blocks WHERE id > ${id} LIMIT 25`
  )) as unknown as [blockDataRaw[]];
  return rows.map((obj) => ({
    
    
    mobileNohashed: Buffer.from(obj.mobileNohashed).toString('base64'),
    type: obj.type,
    mobileNoEncrypted: Buffer.from(obj.mobileNoEncrypted).toString('base64'),
    mobNoEn: decryptFromBuffer(obj.mobileNoEncrypted),
  }));
}

export async function maxPageNo() {
  const [rows] = (await pool.execute(
    `SELECT COUNT(*) as count FROM blocks`
  ));
  const result = rows as { count: number }[];
  return Math.ceil(result[0].count / 25);

}

export async function addNo(mobileNo: string) {
  const verified = await verify();
  if (!verified) return "Unauthorized";

  const mobileNoEncrypted = encryptToBuffer(mobileNo);
  const mobileNohashed = hashToBuffer(mobileNo);

  await pool.execute(
    `INSERT INTO blocks (mobNoEn, mobNoHs) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE type = 0`,
    [mobileNoEncrypted, mobileNohashed]
  );
}

export async function changeType(mobileNohashed: Buffer) {
  const verified = await verify();
  if (!verified) return "Unauthorized";

  await pool.execute(`UPDATE blocks SET type = 1 - type WHERE mobNoHs = ?`, [
    mobileNohashed,
  ]);
}

export async function addNoAction(_: serverActionState, formData: FormData): Promise<serverActionState> {
  try {
    const code = formData.get("code")?.toString() || "";
    const number = formData.get("number")?.toString() || "";
    if (!number) return { success: false, error: "Missing number" };
    const mobileNo = `${code} ${number}`.trim();
    const res = await addNo(mobileNo);
    if (res === "Unauthorized") return { success: false, error: "Unauthorized" };
    return { success: true, error: "" };
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}

export async function changeTypeAction(_: serverActionState, formData: FormData): Promise<serverActionState> {
  try {
    const mobile = formData.get("mobileNo")?.toString();
    if (!mobile) return { success: false, error: "Missing mobileNo" };
    const mobileNohashed = hashToBuffer(mobile);
    const res = await changeType(mobileNohashed);
    if (res === "Unauthorized") return { success: false, error: "Unauthorized" };
    return { success: true, error: "" };
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}

export async function bulkUploadAction(_: serverActionState, formData: FormData): Promise<serverActionState> {
  try {
    const verified = await verify();
    if (!verified) return { success: false, error: "Unauthorized" };
    
    const file = formData.get("file-input") as File;
    if (!file) return { success: false, error: "No file selected" };
    
    const text = await file.text();
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const mobileNo of lines) {
      try {
        const mobileNoEncrypted = encryptToBuffer(mobileNo);
        const mobileNohashed = hashToBuffer(mobileNo);
        await pool.execute(
          `INSERT INTO blocks (mobNoEn, mobNoHs, type) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE type = 0`,
          [mobileNoEncrypted, mobileNohashed]
        );
        successCount++;
      } catch (e) {
        errorCount++;
      }
    }
    
    if (errorCount > 0) {
      return { success: true, error: `Imported ${successCount} numbers, ${errorCount} failed` };
    }
    return { success: true, error: `Imported ${successCount} numbers` };
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}
