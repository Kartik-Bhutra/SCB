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
import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { db, redis } from "@/db";
import { rpID } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { type loginActionResult, origin } from "@/types/serverActions";

interface AdminRow extends RowDataPacket {
  hashed_password: string;
  type: number;
}

interface PasskeyIdRow extends RowDataPacket {
  id: Buffer;
}

interface PasskeyFullRow extends RowDataPacket {
  id: Buffer;
  public_key: Buffer;
  counter: number;
}

export async function startLogin(
  _: loginActionResult | PublicKeyCredentialRequestOptionsJSON,
  formData: FormData,
): Promise<loginActionResult | PublicKeyCredentialRequestOptionsJSON> {
  try {
    const adminId = String(formData.get("userId") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!adminId || !password) return "INVALID INPUT";

    const [rows] = await db.execute<AdminRow[]>(
      `
        SELECT hashed_password, type
        FROM admins
        WHERE admin_id = ?
        LIMIT 1
      `,
      [adminId],
    );

    if (!rows.length) return "INVALID CREDENTIALS";

    const { hashed_password, type } = rows[0];

    const validPassword = await verifyPassword(hashed_password, password);
    if (!validPassword) return "INVALID CREDENTIALS";

    if (type === 2) return "UNAUTHORIZED";

    const cookieStore = await cookies();
    const userHash = hashToBuffer(adminId).toString("base64url");

    if (!type) {
      const sessionId = randomUUID();

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

    const [credentials] = await db.execute<PasskeyIdRow[]>(
      `SELECT id FROM passkeys WHERE admin_id = ?`,
      [adminId],
    );

    if (!credentials.length) return "PASSKEY NOT FOUND";

    const allowCredentials = credentials.map(({ id }) => ({
      id: id.toString("base64url"),
      type: "public-key" as const,
    }));

    const options: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "required",
    });

    const challengeToken = randomUUID();

    await redis.set(
      userHash,
      JSON.stringify({
        adminId,
        challenge: options.challenge,
        challengeToken,
      }),
      { expiration: { type: "EX", value: 300 } },
    );

    cookieStore.set("webauthn_session", `${userHash}:${challengeToken}`, {
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
    const token = cookieStore.get("webauthn_session")?.value;

    if (!token) return "SESSION EXPIRED";

    const [redisKey, sessionId] = token.split(":");
    if (!redisKey || !sessionId) return "INVALID SESSION";

    const stored = await redis.get(redisKey);
    if (!stored) return "SESSION EXPIRED";

    const { adminId, challenge, challengeToken } = JSON.parse(stored);

    if (sessionId !== challengeToken) return "INVALID SESSION";

    const credentialId = Buffer.from(credential.rawId, "base64url");

    const [rows] = await db.execute<PasskeyFullRow[]>(
      `
        SELECT id, public_key, counter
        FROM passkeys
        WHERE id = ? AND admin_id = ?
        LIMIT 1
      `,
      [credentialId, adminId],
    );

    if (!rows.length) return "PASSKEY NOT FOUND";

    const { id, public_key, counter } = rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: id.toString("base64url"),
        publicKey: new Uint8Array(public_key),
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

    cookieStore.delete("webauthn_session");

    const newSessionId = randomUUID();

    await redis.set(
      redisKey,
      JSON.stringify({
        sessionId: newSessionId,
        type: true,
        userId: adminId,
      }),
      { expiration: { type: "EX", value: 86400 } },
    );

    cookieStore.set("token", `${redisKey}:${newSessionId}`, {
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
