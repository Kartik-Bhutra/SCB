"use server";

import { pool } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { isAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw {
  type: boolean;
  mobileNoEncrypted: Buffer;
}

export interface Data {
  type: boolean;
  mobileNo: string;
  reporter: number;
}

export async function fetchData(page: number): Promise<ActionResult | Data[]> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await pool.execute(
    `
    SELECT
      id,
      mobNoEn AS mobileNoEncrypted,
      mobNoHs AS reportedHash
    FROM reported
    WHERE id > ?
    ORDER BY id
    LIMIT 25
    `,
    [offset],
  )) as unknown as [
    {
      id: number;
      mobileNoEncrypted: Buffer;
      reportedHash: Buffer;
    }[],
  ];

  if (rows.length === 0) return [];

  const reportedHashes = rows.map((r) => r.reportedHash);
  const placeholders = reportedHashes.map(() => "?").join(",");

  const [repRows] = (await pool.execute(
    `
    SELECT repNoHs
    FROM reporter
    WHERE repNoHs IN (${placeholders})
    `,
    reportedHashes,
  )) as unknown as [
    {
      repNoHs: Buffer;
    }[],
  ];

  const countMap = new Map<string, number>();

  for (const r of repRows) {
    const key = r.repNoHs.toString("hex");
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  return rows.map((r) => ({
    type: false,
    mobileNo: decryptFromBuffer(r.mobileNoEncrypted),
    reporter: countMap.get(r.reportedHash.toString("hex")) ?? 0,
  }));
}

export async function maxPageNo(): Promise<number> {
  const [rows] = await pool.execute(
    "SELECT id FROM reported ORDER BY id DESC LIMIT 1",
  );

  const result = rows as { id: number }[];

  if (result.length === 0) return 0;

  return Math.ceil(result[0].id / 25);
}

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const mobile = String(formData.get("mobileNo"));
  try {
    await pool.execute(
      "UPDATE reported SET type = 1 - type WHERE mobNoHs = ?",
      [hashToBuffer(mobile)],
    );

    await sendHighPriorityAndroid();
    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
