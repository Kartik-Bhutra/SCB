import { client, pool } from "@/db";
import { hashToBuffer } from "@/hooks/hash";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  
  const mobileNo = await req.text();
  const mobHs = hashToBuffer(mobileNo);

  const [rows] = await pool.execute(
    {
      sql: `SELECT type FROM users WHERE mobNoHs = ? LIMIT 1`,
      rowsAsArray: true,
    },
    [mobHs]
  ) as unknown as [number[][]];

  const exists = rows.length > 0;
  const type = exists ? rows[0][0]  : null;

  if (type === 2) {
    return NextResponse.json({
      exists: true,
      allowed: false,
      reason: "User is blocked",
    });
  }

  const validateText = randomBytes(8).toString("hex");
  const redisKey = mobHs.toString("base64");

  await client.json.set(redisKey, "$", {
    validateText,
    exists,
  });
  await client.expire(redisKey, 600);

  return NextResponse.json({
    exists,
    allowed: true,
    validateText,
  });
}
