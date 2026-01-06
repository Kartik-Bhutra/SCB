"use server";

import { randomUUID } from "node:crypto";
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
import { type loginActionResult, origin } from "@/types/serverActions";

export async function serverAction(
  _: loginActionResult | PublicKeyCredentialRequestOptionsJSON,
  formData: FormData,
): Promise<loginActionResult | PublicKeyCredentialRequestOptionsJSON> {
  try {
    const userId = String(formData.get("userId") || "");
    const password = String(formData.get("password") || "");

    if (!userId || !password) return "INVALID_INPUT";

    const [rows] = (await pool.execute(
      {
        sql: `SELECT passHash, type FROM admins WHERE userId = ? LIMIT 1`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [[string, boolean][]];

    if (!rows.length) return "INVALID_CREDENTIALS";

    const [passHash, type] = rows[0];
    if (!(await verify(passHash, password))) {
      return "INVALID_CREDENTIALS";
    }

    const cookieStore = await cookies();

    if (!type) {
      const sessionId = randomUUID();
      const userHash = hashToBuffer(userId).toString("base64url");

      await client.set(
        userHash,
        JSON.stringify({
          sessionId,
          type: false,
        }),
        {
          expiration: {
            type: "EX",
            value: 86400,
          },
        },
      );

      cookieStore.set("token", `${userHash}:${sessionId}`, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
        path: "/",
      });

      return "OK";
    }

    const [creds] = (await pool.execute(
      {
        sql: `SELECT id FROM passkeys WHERE userId = ?`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];

    if (!creds.length) return "PASSKEY_NOT_FOUND";

    const allowCredentials = creds.map((r) => ({
      id: r[0],
    }));

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID,
        allowCredentials,
      });

    const sessionKey = randomUUID();

    await client.set(
      sessionKey,
      JSON.stringify({
        userId,
        challenge: options.challenge,
      }),
      {
        expiration: {
          type: "EX",
          value: 300,
        },
      },
    );

    cookieStore.set("webauthn_session", sessionKey, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 300,
      path: "/",
    });

    return options;
  } catch {
    return "INTERNAL_ERROR";
  }
}

export async function verifyLogin(
  credential: AuthenticationResponseJSON,
): Promise<loginActionResult> {
  try {
    const cookieStore = await cookies();
    const sessionKey = cookieStore.get("webauthn_session")?.value;
    if (!sessionKey) return "SESSION_EXPIRED";

    const sessionData = await client.get(sessionKey);
    if (!sessionData) return "SESSION_EXPIRED";

    const { userId, challenge } = JSON.parse(sessionData);

    const webAuthnId = Buffer.from(credential.rawId);

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

    if (!rows.length) return "PASSKEY_NOT_FOUND";

    const [storedId, publicKey, counter] = rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: storedId,
        publicKey: new Uint8Array(publicKey),
        counter,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return "WEBAUTHN_FAILED";
    }

    await pool.execute(`UPDATE passkeys SET counter = ? WHERE webAuthnId = ?`, [
      verification.authenticationInfo.newCounter,
      webAuthnId,
    ]);

    await client.del(sessionKey);
    cookieStore.delete("webauthn_session");

    const sessionId = randomUUID();
    const userHash = hashToBuffer(userId).toString("base64url");

    await client.set(
      userHash,
      JSON.stringify({
        sessionId,
        type: true,
        userId,
      }),
      {
        expiration: {
          type: "EX",
          value: 86400,
        },
      },
    );

    cookieStore.set("token", `${userHash}:${sessionId}`, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return "OK";
  } catch {
    return "INTERNAL_ERROR";
  }
}
