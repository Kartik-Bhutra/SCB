"use server";

import { db } from "@/db";
import { decryptFromBuffer, encryptToBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { getAdmin } from "@/server/auth";
import { sendHighPriorityAndroid } from "@/server/message";
import type { ActionResult } from "@/types/serverActions";

export interface Data {
  type: number;
  mobileNo: string;
  reporter: number;
}

export async function fetchData(
  lastId: number,
): Promise<ActionResult | Data[]> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const [rows] = (await db.execute(
    `
      SELECT
        r.id,
        r.encrypted_number,
        r.type,
        COUNT(rep.hashed_reported) AS reporterCount
      FROM reported r
      LEFT JOIN reporters rep
        ON r.hashed_number = rep.hashed_reported
      WHERE r.id > ?
      GROUP BY r.id
      ORDER BY r.id ASC
      LIMIT 25
    `,
    [lastId],
  )) as unknown as [
    {
      id: number;
      encrypted_number: Buffer;
      type: number;
      reporterCount: number;
    }[],
  ];

  return rows.map((row) => ({
    type: row.type,
    mobileNo: decryptFromBuffer(row.encrypted_number),
    reporter: row.reporterCount,
  }));
}

export async function maxPageNo(): Promise<number> {
  const [rows] = (await db.execute(
    "SELECT id FROM reported ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const raw = String(formData.get("mobileType") || "").trim();
  if (!raw) return "INVALID INPUT";

  const [mobileNo, typeStr] = raw.split(":");
  const type = Number(typeStr);

  if (!mobileNo || Number.isNaN(type)) return "INVALID INPUT";

  const mobHash = hashToBuffer(mobileNo);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE reported
        SET type = ?
        WHERE hashed_number = ?
      `,
      [type, mobHash],
    );

    if (type === 2) {
      await connection.execute(
        `
          INSERT INTO blocks
            (encrypted_number, hashed_number, blocked_by, type)
          VALUES (?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE
            type = 1,
            blocked_by = VALUES(blocked_by)
        `,
        [encryptToBuffer(mobileNo), mobHash, adminId],
      );
    } else {
      await connection.execute(
        `
          UPDATE blocks
          SET type = 0,
              blocked_by = ?
          WHERE hashed_number = ?
        `,
        [adminId, mobHash],
      );
    }

    await connection.commit();

    await sendHighPriorityAndroid();

    return "OK";
  } catch {
    await connection.rollback();
    return "SERVER ERROR";
  } finally {
    connection.release();
  }
}
