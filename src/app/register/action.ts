"use server";

import { randomUUID } from "node:crypto";
import { verify as verifyHash } from "@node-rs/argon2";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { client, pool } from "@/db";
import { rpID, rpName } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { type ActionResult, origin } from "@/types/serverActions";

export async function serverAction(
  _: ActionResult | PublicKeyCredentialCreationOptionsJSON,
  formData: FormData,
): Promise<ActionResult | PublicKeyCredentialCreationOptionsJSON> {
  try {
    const userId = String(formData.get("userId") || "");
    const plainPassword = String(formData.get("password") || "");
    const sessionKey = String(formData.get("session") || "");

    if (!userId || !plainPassword || !sessionKey) {
      return "INVALID_INPUT";
    }

    const [rows] = (await pool.execute(
      {
        sql: `SELECT passHash, type FROM admins WHERE userId = ? AND type = 1 LIMIT 1`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    if (rows.length !== 1) return "INVALID_CREDENTIALS";

    const [storedHash] = rows[0];
    const ok = await verifyHash(storedHash, plainPassword);
    if (!ok) return "INVALID_CREDENTIALS";

    const redisKey = hashToBuffer(userId).toString("hex");
    const redisVal = await client.get(redisKey);
    if (!redisVal || redisVal !== sessionKey) return "UNAUTHORIZED";

    const [creds] = (await pool.execute(
      {
        sql: `SELECT id FROM passkeys WHERE userId = ?`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    const excludeCredentials = creds.map((r) => ({
      id: r[0],
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: userId,
      userID: hashToBuffer(userId),
      userDisplayName: userId,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
        authenticatorAttachment: "cross-platform",
      },
      excludeCredentials,
    });

    const key = randomUUID();
    await client.set(key, userId + options.challenge);
    await client.expire(key, 300);

    const cookieStore = await cookies();
    cookieStore.set("session", key, {
      maxAge: 300,
    });

    return options;
  } catch {
    return "INTERNAL_ERROR";
  }
}

export async function verifyRegistration(
  credential: RegistrationResponseJSON,
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return "INVALID_CREDENTIALS";

    const redisVal = await client.get(session);
    if (!redisVal) return "INVALID_CREDENTIALS";

    const userId = redisVal.slice(0, 8);
    const expectedChallenge = redisVal.slice(8);
    if (!userId || !expectedChallenge) return "UNAUTHORIZED";

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return "UNAUTHORIZED";
    }

    const {
      credential: { id, publicKey, counter },
    } = verification.registrationInfo;

    const webAuthnId = Buffer.from(id, "base64url");

    await pool.execute(
      `
      INSERT INTO passkeys
      (id, publicKey, userId, webAuthnId, counter)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id, publicKey, userId, webAuthnId, counter],
    );

    await client.del(session);
    cookieStore.delete("session");

    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
