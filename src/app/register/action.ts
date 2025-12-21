"use server";

import { verify } from "@node-rs/argon2";
import { client, pool } from "@/db";
import { hashToBuffer } from "@/hooks/hash";
import { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { ActionResult } from "@/types/serverActions";
import { rpID, rpName } from "../../../env";

export async function serverAction(
  _: ActionResult | PublicKeyCredentialCreationOptionsJSON,
  formData: FormData
): Promise<ActionResult | PublicKeyCredentialCreationOptionsJSON> {
  try {
    const userId = String(formData.get("userId"));
    const plainPassword = String(formData.get("password"));
    const sessionKey = String(formData.get("session"));

    if (!userId || !plainPassword || !sessionKey) {
      return "INVALID_INPUT";
    }

    const [rows] = (await pool.execute(
      {
        sql: `SELECT passHash, type FROM admins WHERE userId = ? AND type = 1 LIMIT 1`,
        rowsAsArray: true,
      },
      [userId]
    )) as unknown as [string[][]];

    if (rows.length !== 1) {
      return "INVALID_CREDENTIALS";
    }

    const [storedPasswordHash] = rows[0];

    const isPasswordValid = await verify(storedPasswordHash, plainPassword);
    if (!isPasswordValid) {
      return "INVALID_CREDENTIALS";
    }

    const userHash = hashToBuffer(userId).toString("hex");
    const data = await client.get(userHash);

    if (!data || data !== sessionKey) {
      return "UNAUTHORIZED";
    }

    const options: PublicKeyCredentialCreationOptionsJSON =
      await generateRegistrationOptions({
        rpName,
        rpID,
        userName: userId,
      });

    return options;
  } catch {
    return "INTERNAL_ERROR";
  }
}
