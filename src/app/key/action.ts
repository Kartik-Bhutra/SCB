"use server";

import { randomUUID } from "node:crypto";
import { verify as verifyPassword } from "@node-rs/argon2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { cookies } from "next/headers";
import { redis, db } from "@/db";
import { rpID, rpName } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { origin, type keyActionResult } from "@/types/serverActions";

export async function startPasskeyRegistration(
  _: keyActionResult | PublicKeyCredentialCreationOptionsJSON,
  formData: FormData,
): Promise<keyActionResult | PublicKeyCredentialCreationOptionsJSON> {
  try {
    const adminId = String(formData.get("userId") || "").trim();
    const password = String(formData.get("password") || "");
    const sessionToken = String(formData.get("session") || "");

    if (!adminId || !password || !sessionToken) {
      return "INVALID INPUT";
    }

    const [rows] = (await db.execute(
      {
        sql: `
          SELECT hashed_password
          FROM admins
          WHERE user_id = ? AND type = 1
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [adminId],
    )) as unknown as [string[][]];

    if (!rows.length) return "INVALID CREDENTIALS";

    const hashedPassword = rows[0][0];

    if (!(await verifyPassword(hashedPassword, password)))
      return "INVALID CREDENTIALS";

    const redisKey = hashToBuffer(adminId).toString("hex");
    const storedSession = await redis.get(redisKey);

    if (!storedSession) return "SESSION EXPIRED";

    if (storedSession !== sessionToken) return "INVALID SESSION";

    await redis.del(redisKey);

    const [existing] = (await db.execute(
      {
        sql: `SELECT id FROM passkeys WHERE user_id = ?`,
        rowsAsArray: true,
      },
      [adminId],
    )) as unknown as [Buffer[][]];

    const excludeCredentials = existing.map(([id]) => ({
      id: id.toString("base64url"),
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: adminId,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
      },
    });

    const challengeToken = randomUUID();

    await redis.set(
      challengeToken,
      JSON.stringify({
        adminId,
        challenge: options.challenge,
      }),
      { expiration: { type: "EX", value: 300 } },
    );

    (await cookies()).set("webauthn_session", challengeToken, {
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

export async function completePasskeyRegistration(
  credential: RegistrationResponseJSON,
): Promise<keyActionResult> {
  try {
    const cookieStore = await cookies();
    const challengeToken = cookieStore.get("webauthn_session")?.value;

    if (!challengeToken) return "SESSION EXPIRED";

    const stored = await redis.get(challengeToken);
    if (!stored) return "SESSION EXPIRED";

    const { adminId, challenge } = JSON.parse(stored);

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return "WEBAUTHN FAILED";
    }

    const { publicKey, counter } = verification.registrationInfo.credential;

    const credentialId = Buffer.from(credential.rawId, "base64url");

    await db.execute(
      `
          INSERT INTO passkeys
            (id, public_key, user_id, counter)
          VALUES (?, ?, ?, ?)
        `,
      [credentialId, publicKey, adminId, counter],
    );

    await redis.del(challengeToken);
    cookieStore.delete("webauthn_session");

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
