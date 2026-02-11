"use server";

import { randomUUID } from "node:crypto";
import { verify as verifyPassword } from "@node-rs/argon2";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { redis, db } from "@/db";
import { rpID } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { type loginActionResult, origin } from "@/types/serverActions";

export async function startLogin(
  _: loginActionResult | PublicKeyCredentialRequestOptionsJSON,
  formData: FormData,
): Promise<loginActionResult | PublicKeyCredentialRequestOptionsJSON> {
  try {
    const userId = String(formData.get("userId") || "").trim();
    const password = String(formData.get("password") || "");

    if (!userId || !password) return "INVALID INPUT";

    const [rows] = (await db.execute(
      {
        sql: `
          SELECT hashed_password, type
          FROM admins
          WHERE user_id = ?
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [[string, boolean][]];

    if (!rows.length) return "INVALID CREDENTIALS";

    const [passwordHash, isAdmin] = rows[0];

    if (!(await verifyPassword(passwordHash, password))) {
      return "INVALID CREDENTIALS";
    }

    const cookieStore = await cookies();

    if (!isAdmin) {
      const sessionId = randomUUID();
      const userHash = hashToBuffer(userId).toString("base64url");

      await redis.set(userHash, JSON.stringify({ sessionId, type: false }), {
        expiration: { type: "EX", value: 86400 },
      });

      cookieStore.set("token", `${userHash}:${sessionId}`, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
        path: "/",
      });

      return "OK";
    }

    const [credentials] = (await db.execute(
      {
        sql: `SELECT id FROM passkeys WHERE user_id = ?`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [Buffer[][]];

    if (!credentials.length) return "PASSKEY NOT FOUND";

    const allowCredentials = credentials.map(([id]) => ({
      id: id.toString("base64url"),
    }));

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        userVerification: "required",
      });

    const challengeToken = randomUUID();

    await redis.set(
      challengeToken,
      JSON.stringify({ userId, challenge: options.challenge }),
      { expiration: { type: "EX", value: 300 } },
    );

    cookieStore.set("webauthn_session", challengeToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 300,
      path: "/",
    });

    return options;
  } catch {
    return "SERVER ERROR";
  }
}

export async function completeLogin(
  credential: AuthenticationResponseJSON,
): Promise<loginActionResult> {
  try {
    const cookieStore = await cookies();
    const challengeToken = cookieStore.get("webauthn_session")?.value;

    if (!challengeToken) return "SESSION EXPIRED";

    const stored = await redis.get(challengeToken);
    if (!stored) return "SESSION EXPIRED";

    const { userId, challenge } = JSON.parse(stored);

    const credentialId = Buffer.from(credential.rawId, "base64url");

    const [rows] = (await db.execute(
      {
        sql: `
          SELECT id, public_key, counter
          FROM passkeys
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [credentialId, userId],
    )) as unknown as [[Buffer, Buffer, number][]];

    if (!rows.length) return "PASSKEY NOT FOUND";

    const [storedId, publicKey, counter] = rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: storedId.toString("base64url"),
        publicKey: new Uint8Array(publicKey),
        counter,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return "WEBAUTHN FAILED";
    }

    await db.execute(`UPDATE passkeys SET counter = ? WHERE id = ?`, [
      verification.authenticationInfo.newCounter,
      credentialId,
    ]);

    await redis.del(challengeToken);
    cookieStore.delete("webauthn_session");

    const sessionId = randomUUID();
    const userHash = hashToBuffer(userId).toString("base64url");

    await redis.set(
      userHash,
      JSON.stringify({
        sessionId,
        type: true,
        userId,
      }),
      { expiration: { type: "EX", value: 86400 } },
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
    return "SERVER ERROR";
  }
}
