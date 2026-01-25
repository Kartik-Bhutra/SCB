"use server";

import { randomUUID } from "node:crypto";
import { verify } from "@node-rs/argon2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { cookies } from "next/headers";
import { client, pool } from "@/db";
import { rpID, rpName } from "@/env";
import { hashToBuffer } from "@/hooks/hash";
import { origin, type keyActionResult } from "@/types/serverActions";

export async function serverAction(
  _: keyActionResult | PublicKeyCredentialCreationOptionsJSON,
  formData: FormData,
): Promise<keyActionResult | PublicKeyCredentialCreationOptionsJSON> {
  try {
    const userId = String(formData.get("userId") || "");
    const password = String(formData.get("password") || "");
    const sessionKey = String(formData.get("session") || "");

    if (!userId || !password || !sessionKey) {
      return "INVALID_INPUT";
    }

    const [rows] = (await pool.execute(
      {
        sql: `
          SELECT passHash
          FROM admins
          WHERE userId = ? AND type = 1
          LIMIT 1
        `,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];
    console.log("pass1");
    
    if (!rows.length) return "INVALID_CREDENTIALS";
    console.log("pass2");

    if (!(await verify(rows[0][0], password))) {
      return "INVALID_CREDENTIALS";
    }
    console.log("pass3");

    const redisKey = hashToBuffer(userId).toString("hex");
    const storedSession = await client.get(redisKey);
    console.log("pass4");

    if (!storedSession) return "SESSION_EXPIRED";
    await client.del(redisKey);
    console.log("pass5");

    if (storedSession !== sessionKey) return "UNAUTHORIZED";
    console.log("pass6");

    const [creds] = (await pool.execute(
      {
        sql: `SELECT id FROM passkeys WHERE userId = ?`,
        rowsAsArray: true,
      },
      [userId],
    )) as unknown as [string[][]];
    console.log("pass7");

    const excludeCredentials = creds.map((r) => ({
      id: r[0],
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: userId,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
      },
    });

    const challengeKey = randomUUID();

    await client.set(
      challengeKey,
      JSON.stringify({
        userId,
        challenge: options.challenge,
      }),
      { expiration: { type: "EX", value: 300 } },
    );
    console.log("pass8");

    (await cookies()).set("session", challengeKey, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 300,
      path: "/",
    });

    return options;
  } catch (err){
    console.log(err);
    
    return "INTERNAL_ERROR";
  }
}

export async function verifyRegistration(
  credential: RegistrationResponseJSON,
): Promise<keyActionResult> {
  try {
    const cookieStore = await cookies();
    const challengeKey = cookieStore.get("session")?.value;

    if (!challengeKey) return "SESSION_EXPIRED";

    const stored = await client.get(challengeKey);
    if (!stored) return "SESSION_EXPIRED";

    const { userId, challenge } = JSON.parse(stored);

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return "WEBAUTHN_FAILED";
    }

    const {
      credential: { id, publicKey, counter },
    } = verification.registrationInfo;

    const webAuthnId = Buffer.from(credential.rawId);

    await pool.execute(
      `
          INSERT INTO passkeys
            (id, publicKey, userId, webAuthnId, counter)
          VALUES (?, ?, ?, ?, ?)
        `,
      [id, publicKey, userId, webAuthnId, counter],
    );

    await client.del(challengeKey);
    cookieStore.delete("session");

    return "OK";
  } catch (err){
    console.log(err);
    
    return "INTERNAL_ERROR";
  }
}
