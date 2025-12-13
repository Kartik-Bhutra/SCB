"use server";

import { pool } from "@/db";
import { decryptFromBuffer} from "@/hooks/crypto";
import { verify } from "@/server/verify";
import { clientData,serverActionState } from "@/types/serverActions";
interface data {
  name: string;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
  type: number;
}

export async function fetchData(page: number) {
  const verified = await verify();
  if (!verified) {
    return "Unauthorized";
  }
  const id = (page - 1) * 25;
  try {
    const [rows] = (await pool.execute(
      `SELECT 
         name, 
         mobNoEn AS mobileNoEncrypted, 
         mobNoHs AS mobileNohashed,
         type
       FROM users 
       WHERE id > ? LIMIT 25`,
      [id]
    )) as unknown as [data[]];
    return rows.map((obj) => ({
      name: obj.name,
      mobileNohashed: Buffer.from(obj.mobileNohashed).toString('base64'),
      mobileNoEncrypted: Buffer.from(obj.mobileNoEncrypted).toString('base64'),
      mobNoEn: decryptFromBuffer(obj.mobileNoEncrypted),
      type: obj.type,
    })) as clientData[];
  } catch (e: any) {
    console.error("fetchData DB error:", e);
    throw e;
  }
}

export async function fetchTotalPages() {
  const [rows] = (await pool.execute(
    `SELECT COUNT(*) AS count FROM users;`
  )) as unknown as [{ count: number }[]];
  return Math.ceil(rows[0].count / 25);
}

export async function changeType(type: number, mobileNohashed: Buffer) {
  const verified =await verify();
  if (!verified) {
    return "Unauthorized";
  }

  await pool.execute(`UPDATE users SET type = ? WHERE mobNoHs = ?`, [
    type,
    mobileNohashed,
  ]);
}

export async function changeTypeAction(_: serverActionState, formData: FormData): Promise<serverActionState> {
  try {
    const mobile = formData.get("mobileNoHashed")?.toString();
    const typeStr = formData.get("type")?.toString();
    if (!mobile) return { success: false, error: "Missing mobileNo" };
    const type = typeStr ? Number(typeStr) : 1;
    if (Number.isNaN(type)) return { success: false, error: "Invalid type" };
    const mobileNohashed = Buffer.from(mobile, 'base64');
    const res = await changeType(type, mobileNohashed);
    if (res === "Unauthorized") return { success: false, error: "Unauthorized" };
    return { success: true, error: "" };
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}