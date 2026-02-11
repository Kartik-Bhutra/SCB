"use server";

import { redis, db } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { isAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

interface DataRaw {
  name: string;
  mobileNohashed: Buffer;
  mobileNoEncrypted: Buffer;
  type: number;
  deviceId: string;
}

export interface Data {
  name: string;
  mobileNo: string;
  type: number;
  deviceId: string;
}

export async function fetchData(page: number): Promise<ActionResult | Data[]> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const offset = (page - 1) * 25;

  const [rows] = (await db.execute(
    `SELECT 
        name,
        mobNoEn AS mobileNoEncrypted,
        mobNoHs AS mobileNohashed,
        devId as deviceId,
        type
     FROM users
     WHERE id > ?
     LIMIT 25 `,
    [offset],
  )) as unknown as [DataRaw[]];

  return rows.map((obj) => ({
    name: obj.name,
    type: obj.type,
    mobileNo: decryptFromBuffer(obj.mobileNoEncrypted),
    deviceId: obj.deviceId,
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = (await db.execute(
    "SELECT id FROM users ORDER BY id DESC LIMIT 1",
  )) as unknown as [{ id: number }[]];

  if (rows.length === 0) return 0;

  return Math.ceil(rows[0].id / 25);
}

export async function changeTypeAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const mobileDeviceType = String(formData.get("mobileDeviceType")).split(":");
  const type = Number(mobileDeviceType[1]);

  const [mobileNo, deviceId] = mobileDeviceType[0].split(".");
  const mobileNohashed = hashToBuffer(mobileNo);

  const redisKey = `${mobileNohashed.toString("base64url")}:${deviceId}`;

  try {
    await db.execute(
      "UPDATE users SET type = ? WHERE mobNoHs = ? AND devId = ?",
      [type, mobileNohashed, deviceId],
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
