"use server";

import { pool } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { verify } from "@/server/verify";
import { ActionResult, clientData } from "@/types/serverActions";

interface data {
  name: string;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
  type: number;
}

export async function fetchData(page: number) {
  const verified = await verify();
  if (!verified) return "Unauthorized";

  const offset = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
        name,
        mobNoEn AS mobileNoEncrypted,
        mobNoHs AS mobileNohashed,
        type
     FROM users
     WHERE id > ?
     LIMIT 25 `,
    [offset]
  )) as unknown as [data[]];

  return rows.map((obj) => ({
    name: obj.name,
    mobileNohashed: Buffer.from(obj.mobileNohashed).toString("base64"),
    mobileNoEncrypted: Buffer.from(obj.mobileNoEncrypted).toString("base64"),
    mobNoEn: decryptFromBuffer(obj.mobileNoEncrypted),
    type: obj.type,
  })) as clientData[];
}

export async function fetchTotalPages() {
  const [rows] = (await pool.execute(
    "SELECT COUNT(*) AS count FROM users"
  )) as unknown as [{ count: number }[]];

  return Math.ceil(rows[0].count / 25);
}

export async function changeTypeAction(
  _: string,
  formData: FormData
): Promise<ActionResult> {
  const verified = await verify();
  if (!verified) return "UNAUTHORIZED";

  const mobileRaw = String(formData.get("mobileNoHashed"));
  const typeRaw = formData.get("type");

  if (typeof mobileRaw !== "string") return "INVALID_INPUT";

  const type = Number(typeRaw);
  if (!Number.isInteger(type)) return "INVALID_INPUT";

  let mobileNohashed: Buffer;
  try {
    mobileNohashed = Buffer.from(mobileRaw, "base64");
  } catch {
    return "INVALID_INPUT";
  }

  try {
    await pool.execute("UPDATE users SET type = ? WHERE mobNoHs = ?", [
      type,
      mobileNohashed,
    ]);
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
