"use server";

import { db } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { isAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

export interface Data {
  type: number;
  mobileNo: string;
  reporter: number;
}

export async function fetchData(page: number): Promise<ActionResult | Data[]> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await db.execute(
    `
    SELECT
    type,
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
      type: number;
      mobileNoEncrypted: Buffer;
      reportedHash: Buffer;
    }[],
  ];

  if (rows.length === 0) return [];

  const reportedHashes = rows.map((r) => r.reportedHash);
  const placeholders = reportedHashes.map(() => "?").join(",");

  const [repRows] = (await db.execute(
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
    type: r.type,
    mobileNo: decryptFromBuffer(r.mobileNoEncrypted),
    reporter: countMap.get(r.reportedHash.toString("hex")) ?? 0,
  }));
}

export async function maxPageNo(): Promise<number> {
  const [rows] = await db.execute(
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

  const raw = String(formData.get("mobileType"));
  if (!raw) return "INVALID INPUT";

  const [mobileNo, typeStr] = raw.split(":");
  const type = Number(typeStr);

  if (!mobileNo) {
    return "INVALID INPUT";
  }

  const mobHash = hashToBuffer(mobileNo);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute("UPDATE reported SET type = ? WHERE mobNoHs = ?", [
      type,
      mobHash,
    ]);

    const [blockRows] = (await connection.execute(
      "SELECT 1 FROM blocks WHERE mobNoHs = ? LIMIT 1",
      [mobHash],
    )) as unknown as [unknown[]];

    const existsInBlocks = blockRows.length > 0;

    if (type === 2) {
      if (existsInBlocks) {
        await connection.execute(
          "UPDATE blocks SET type = 1 WHERE mobNoHs = ?",
          [mobHash],
        );
      } else {
        await connection.execute(
          `
          INSERT INTO blocks (mobNoEn, mobNoHs, type)
          VALUES (?, ?, 1)
          `,
          [encryptToBuffer(mobileNo), mobHash],
        );
      }
    } else {
      await connection.execute("UPDATE blocks SET type = 0 WHERE mobNoHs = ?", [
        mobHash,
      ]);
    }

    await connection.commit();
    await sendHighPriorityAndroid();
    return "OK";
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return "SERVER ERROR";
  } finally {
    connection.release();
  }
}
