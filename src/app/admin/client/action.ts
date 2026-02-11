"use server";

import { redis, db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { isAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw {
  name: string;
  encrypted_number: Buffer;
  hashed_number: Buffer;
  type: number;
  device_id: string;
}

export interface Data {
  name: string;
  mobileNo: string;
  type: number;
  deviceId: string;
}

export async function fetchData(
  lastId: number,
): Promise<ActionResult | Data[]> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const [rows] = (await db.execute(
    `
      SELECT
        u.name,
        u.encrypted_number,
        u.hashed_number,
        d.device_id,
        CASE
          WHEN d.reviewed_by IS NULL THEN 0
          ELSE d.type
        END AS type
      FROM devices d
      JOIN users u
        ON d.hashed_number = u.hashed_number
      WHERE d.id > ?
      ORDER BY d.id ASC
      LIMIT 25
    `,
    [lastId],
  )) as unknown as [DataRaw[]];

  return rows.map((obj) => ({
    name: obj.name,
    type: obj.type,
    mobileNo: decryptFromBuffer(obj.encrypted_number),
    deviceId: obj.device_id,
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = (await db.execute(
    "SELECT id FROM devices ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}

import { getAdmin } from "@/server/auth";

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const mobileDeviceType = String(formData.get("mobileDeviceType")).split(":");

  const type = Number(mobileDeviceType[1]);

  const [mobileNo, deviceId] = mobileDeviceType[0].split(".");

  const mobileNohashed = hashToBuffer(mobileNo);

  const redisKey = `${mobileNohashed.toString("base64url")}:${deviceId}`;

  try {
    await db.execute(
      `
        UPDATE devices
        SET type = ?,
            reviewed_by = ?
        WHERE hashed_number = ?
          AND device_id = ?
      `,
      [type, adminId, mobileNohashed, deviceId],
    );

    const cached = await redis.get(redisKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      await redis.set(
        redisKey,
        JSON.stringify({
          session: parsed.session,
          type,
          mobileNo,
        }),
        {
          expiration: {
            type: "EX",
            value: 604800,
          },
        },
      );
    }

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
