"use server";

import { pool } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { verify } from "@/server/verify";

interface data {
  type: boolean;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
}

export async function getData(type: number, page: number) {
  const verified = await verify();
  if (!verified) return "Unauthorized";

  const id = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `SELECT 
        mobNoEn as mobileNoEncrypted,
        mobNoHs as mobileNohashed,
        type
     FROM blocks WHERE id > ${id} LIMIT 25`
  )) as unknown as [data[]];

  return rows.map((obj) => ({
    ...obj,
    mobNoEn: decryptFromBuffer(obj.mobileNoEncrypted),
  }));
}

export async function addNumber(mobileNo: string) {
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

export async function changeType(type: number, mobileNohashed: Buffer) {
  const verified = await verify();
  if (!verified) return "Unauthorized";

  await pool.execute(`UPDATE blocks SET type = ? WHERE mobNoHs = ?`, [
    type,
    mobileNohashed,
  ]);
}
