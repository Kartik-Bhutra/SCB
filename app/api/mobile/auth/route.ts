import { getDB } from "@/lib/db";
import { authClient, clientDevice } from "@/types/serverActions";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export async function POST(request: Request) {
  try {
    const { deviceId } = (await request.json()) as clientDevice;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const secret = process.env.ENCRYPTED_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const deviceIdHashed = createHmac("sha-256", secret)
      .update(deviceId)
      .digest("base64url");

    const db = getDB();
    const q =
      "SELECT mobileNoEncrypted, username, authenticated FROM users WHERE deviceIdHashed = ?";
    const [rows] = await db.query(q, [deviceIdHashed]);
    const authenticatedDevices = (rows as authClient[]).filter(
      ({ authenticated }) => authenticated,
    );

    if (authenticatedDevices.length === 0) {
      return NextResponse.json(
        { error: "Device not authenticated" },
        { status: 404 },
      );
    }

    return NextResponse.json({ authenticatedDevices }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
