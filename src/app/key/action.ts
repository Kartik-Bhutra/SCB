"use server";

import { randomUUID } from "node:crypto";
import { verify as verifyPassword } from "@node-rs/argon2";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { db, redis } from "@/db";
import { rpID, rpName } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { type keyActionResult, origin } from "@/types/serverActions";

interface AdminRow extends RowDataPacket {
  hashed_password: string;
}

interface PasskeyRow extends RowDataPacket {
  id: Buffer;
}

export async function startPasskeyRegistration(
  _: keyActionResult | PublicKeyCredentialCreationOptionsJSON,
  formData: FormData,
): Promise<keyActionResult | PublicKeyCredentialCreationOptionsJSON> {
  try {
    const adminId = String(formData.get("userId") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const sessionToken = String(formData.get("session") ?? "");

    if (!adminId || !password || !sessionToken) {
      return "INVALID INPUT";
    }

    const [rows] = await db.execute<AdminRow[]>(
      `
        SELECT hashed_password
        FROM admins
        WHERE admin_id = ? AND type = 1
        LIMIT 1
      `,
      [adminId],
    );

    if (!rows.length) return "INVALID CREDENTIALS";

    const validPassword = await verifyPassword(rows[0].hashed_password, password);

    if (!validPassword) return "INVALID CREDENTIALS";

    const redisKey = hashToBuffer(adminId).toString("base64url");

    const storedSession = await redis.get(redisKey);
    if (!storedSession) return "SESSION EXPIRED";
    if (storedSession !== sessionToken) return "INVALID SESSION";

    const [existing] = await db.execute<PasskeyRow[]>(
      `SELECT id FROM passkeys WHERE admin_id = ?`,
      [adminId],
    );

    const excludeCredentials = existing.map(({ id }) => ({
      id: id.toString("base64url"),
      type: "public-key" as const,
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: adminId,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        userVerification: "required",
      },
    });

    const challengeToken = randomUUID();

    await redis.set(
      redisKey,
      JSON.stringify({
        adminId,
        challenge: options.challenge,
        challengeToken,
      }),
      { expiration: { type: "EX", value: 300 } },
    );

    (await cookies()).set("webauthn_session", `${redisKey}:${challengeToken}`, {
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
    const token = cookieStore.get("webauthn_session")?.value;

    if (!token) return "SESSION EXPIRED";

    const [redisKey, sessionId] = token.split(":");
    if (!redisKey || !sessionId) return "INVALID SESSION";

    const stored = await redis.get(redisKey);
    if (!stored) return "INVALID SESSION";

    const { adminId, challenge, challengeToken } = JSON.parse(stored);

    if (sessionId !== challengeToken) return "INVALID SESSION";

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

    const {
      credential: { publicKey, counter },
    } = verification.registrationInfo;

    const credentialId = Buffer.from(credential.rawId, "base64url");

    try {
      await db.execute(
        `
          INSERT INTO passkeys
            (id, public_key, admin_id, counter)
          VALUES (?, ?, ?, ?)
        `,
        [credentialId, publicKey, adminId, counter],
      );
    } catch /* (err) */ {
      // if (err?.code === "ER_DUP_ENTRY") {
      //   return "PASSKEY ALREADY REGISTERED";
      // }
      // throw err;
    }

    await redis.del(redisKey);
    cookieStore.delete("webauthn_session");

    return "OK";
  } catch {
    return "SERVER ERROR";
  }
}
