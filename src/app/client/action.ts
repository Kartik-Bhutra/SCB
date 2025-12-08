"use server";

import { pool } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { verify } from "@/server/verify";

interface data {
  name: string;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
}

export async function getData(type: number, page: number) {
  const verified = verify();
  if (!verified) {
    return "Unauthorized";
  }

  const id = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
       name, 
       mobNoEn AS mobileNoEncrypted, 
       mobNoHs AS mobileNohashed 
     FROM users 
     WHERE type = ? and id > ${id} LIMIT 25`
  ),
  [type]) as unknown as [data[]];

  return rows.map((obj) => ({
    ...obj,
    mobileNoEncrypted: decryptFromBuffer(obj.mobileNoEncrypted),
  }));
}

export async function changeType(type: number, mobileNohashed: Buffer) {
  const verified = verify();
  if (!verified) {
    return "Unauthorized";
  }

  await pool.execute(`UPDATE users SET type = ? WHERE mobNoHs = ?`, [
    type,
    mobileNohashed,
  ]);
}
