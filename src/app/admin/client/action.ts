"use server";

import type { RowDataPacket } from "mysql2";
import { db, redis } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { bufferToUuid, uuidToBuffer } from "@/hooks/uuid";
import { getAdmin, isAdmin } from "@/server/auth";
import type { ActionResult } from "@/types/serverActions";

export type UUID = `${string}-${string}-${string}-${string}-${string}`;

interface DataRaw extends RowDataPacket {
  name: string | null;
  encrypted_number: Buffer;
  type: number;
  device_id: Buffer;
}

export interface Data {
  name: string | null;
  mobileNo: string;
  type: number;
  deviceId: UUID;
}

interface IdRow extends RowDataPacket {
  id: number;
}

export async function fetchData(lastId: number): Promise<ActionResult | Data[]> {
  const verified = await isAdmin();
  if (!verified) return "UNAUTHORIZED";

  const lastPage = (lastId - 1) * 25;

  const [rows] = await db.execute<DataRaw[]>(
    `
      SELECT
        u.name,
        u.encrypted_number,
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
    [lastPage],
  );

  return rows.map((obj) => ({
    name: obj.name,
    type: obj.type,
    mobileNo: decryptFromBuffer(obj.encrypted_number),
    deviceId: bufferToUuid(obj.device_id),
  }));
}

export async function fetchTotalPages(): Promise<number> {
  const [rows] = await db.execute<IdRow[]>(`SELECT id FROM devices ORDER BY id DESC LIMIT 1`);

  if (!rows.length) return 0;

  return Math.ceil(rows[0].id / 25);
}

export async function changeTypeAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const adminId = await getAdmin();
  if (!adminId) return "UNAUTHORIZED";

  const raw = String(formData.get("mobileDeviceType") ?? "");
  const parts = raw.split(":");
  if (parts.length !== 2) return "INVALID INPUT";

  const type = Number(parts[1]);
  if (Number.isNaN(type)) return "INVALID INPUT";

  const [mobileNo, deviceIdStr] = parts[0].split(".");
  if (!mobileNo || !deviceIdStr) return "INVALID INPUT";

  const mobileNohashed = hashToBuffer(mobileNo);
  const deviceIdBuffer = uuidToBuffer(deviceIdStr as UUID);

  const redisKey = `${mobileNohashed.toString("base64url")}:${deviceIdStr}`;

  try {
    /*UPDATE devices
SET type = CASE
    WHEN device_id = ? THEN 1
    WHEN type != 2 THEN 0
    ELSE type
END
WHERE hashed_number = ?
 */
    await db.execute(
      `
        UPDATE devices
        SET type = ?,
            reviewed_by = ?
        WHERE hashed_number = ?
          AND device_id = ?
      `,
      [type, adminId, mobileNohashed, deviceIdBuffer],
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
