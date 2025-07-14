import { getDB } from "@/lib/db";
import {
  changeClient,
  checkAuthClient,
  requestClient,
} from "@/types/serverActions";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/ciphers/webcrypto";
import { utf8ToBytes } from "@noble/ciphers/utils";
import { ResultSetHeader } from "mysql2";

export async function POST(request: Request) {
  try {
    const { username, mobileNo, deviceId } =
      (await request.json()) as requestClient;

    if (!username || !mobileNo || !deviceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const secret = process.env.ENCRYPTED_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const mobileNoHashed = createHmac("sha-256", secret)
      .update(mobileNo)
      .digest("base64url");
    const deviceIdHashed = createHmac("sha-256", secret)
      .update(deviceId)
      .digest("base64url");

    const db = getDB();
    const qCheck =
      "SELECT authenticated, deviceIdHashed FROM users WHERE mobileNoHashed = ?";
    const [rows] = await db.query(qCheck, [mobileNoHashed]);
    const row = (rows as checkAuthClient[])[0];

    if (row) {
      if (row.deviceIdHashed === deviceIdHashed) {
        if (row.authenticated) {
          return NextResponse.json(
            { error: "Device already authenticated" },
            { status: 409 },
          );
        } else {
          return NextResponse.json(
            { error: "User already exists" },
            { status: 409 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "User already exists from different device" },
          { status: 403 },
        );
      }
    }

    const nonce = randomBytes(24);
    const chacha = xchacha20poly1305(utf8ToBytes(secret), nonce);
    const encrypted = chacha.encrypt(utf8ToBytes(mobileNo));
    const mobileNoEncrypted = `${Buffer.from(encrypted).toString("base64url")}:${Buffer.from(nonce).toString("base64url")}`;

    const qInsert =
      "INSERT INTO users (mobileNoHashed, mobileNoEncrypted, username, deviceIdHashed) VALUES (?, ?, ?, ?)";
    await db.query(qInsert, [
      mobileNoHashed,
      mobileNoEncrypted,
      username,
      deviceIdHashed,
    ]);

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { mobileNo, newValue } = (await request.json()) as changeClient;
    const changeTarget = request.headers.get("x-change-target");

    if (!mobileNo || !newValue || !changeTarget) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const secret = process.env.ENCRYPTED_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const mobileNoHashed = createHmac("sha-256", secret)
      .update(mobileNo)
      .digest("base64url");

    const db = getDB();

    let qUpdate = "";
    let updateParam;

    if (changeTarget === "username") {
      qUpdate = "UPDATE users SET username = ? WHERE mobileNoHashed = ?";
      updateParam = [newValue, mobileNoHashed];
    } else if (changeTarget === "deviceId") {
      const newDeviceIdHashed = createHmac("sha-256", secret)
        .update(newValue)
        .digest("base64url");
      qUpdate = "UPDATE users SET deviceIdHashed = ? WHERE mobileNoHashed = ?";
      updateParam = [newDeviceIdHashed, mobileNoHashed];
    } else {
      return NextResponse.json(
        { error: "Invalid change target" },
        { status: 400 },
      );
    }

    const [result] = await db.query<ResultSetHeader>(qUpdate, updateParam);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
