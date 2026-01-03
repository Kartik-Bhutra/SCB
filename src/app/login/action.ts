"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { verify } from "@node-rs/argon2";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { client, pool } from "@/db";
import { rpID } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { type ActionResult, origin } from "@/types/serverActions";

export async function serverAction(
  _: ActionResult | PublicKeyCredentialRequestOptionsJSON,
  formData: FormData,
): Promise<ActionResult | PublicKeyCredentialRequestOptionsJSON> {
  try {
    const userId = String(formData.get("userId"));
    const plainPassword = String(formData.get("password"));

    if (!userId || !plainPassword) {
      return "INVALID_INPUT";
    }

    const [rows] = (await pool.execute(
      {
        sql: `SELECT passHash, type FROM admins WHERE userId = ? AND type = 1 LIMIT 1`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    if (rows.length !== 1) {
      return "INVALID_CREDENTIALS";
    }

    const [storedPasswordHash] = rows[0];

    const isPasswordValid = await verify(storedPasswordHash, plainPassword);
    if (!isPasswordValid) {
      return "INVALID_CREDENTIALS";
    }

    const [creds] = (await pool.execute(
      {
        sql: `SELECT id FROM passkeys WHERE userId = ?`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    const allowCredentials = creds.map((r) => ({
      id: r[0],
    }));

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID,
        allowCredentials,
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

export async function verifyLogin(
  credential: AuthenticationResponseJSON,
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

    const webAuthnId = Buffer.from(credential.id, "base64url");

    const [rows] = (await pool.execute(
      {
        sql: `
          SELECT id, publicKey, counter
          FROM passkeys
          WHERE webAuthnId = ? AND userId = ?
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [webAuthnId, userId],
    )) as unknown as [[string, Buffer, number][]];

    if (rows.length !== 1) return "UNAUTHORIZED";

    const [storedId, storedPublicKey, storedCounter] = rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: storedId,
        publicKey: new Uint8Array(storedPublicKey),
        counter: storedCounter,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return "UNAUTHORIZED";
    }

    const { newCounter } = verification.authenticationInfo;

    await pool.execute(`UPDATE passkeys SET counter = ? WHERE webAuthnId = ?`, [
      newCounter,
      webAuthnId,
    ]);

    await client.del(session);
    cookieStore.delete("session");

    const sessionId = randomBytes(16).toString("hex");
    const userHash = hashToBuffer(userId).toString("base64");
    const sessionToken = userHash + sessionId;

    const redisStatus = await client.set(userHash, sessionId);
    if (redisStatus !== "OK") {
      return "INTERNAL_ERROR";
    }

    await client.expire(userHash, 60 * 60 * 24);

    cookieStore.set("token", sessionToken, {
      maxAge: 60 * 60 * 24,
      // httpOnly: true,
      // secure: true,
      // sameSite: "strict",
      // path: "/",
    });

    return "OK";
  } catch (err) {
    console.error(err);
    return "INTERNAL_ERROR";
  }
}
