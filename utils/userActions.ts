"use server";

import { getDB } from "@/lib/db";
import { JwtPayload, verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { currentAdminDBResponse } from "@/types/serverActions";

const secret = process.env.ENCRYPTED_KEY;

export async function getCurrentUser() {
  if (!secret) {
    return { error: "server error", success: false, role: false, userId: "" };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return {
      error: "no token found",
      success: false,
      role: false,
      userId: "",
    };
  }
  try {
    const { userId } = verify(token, secret) as JwtPayload;
    const db = getDB();
    const q = "SELECT role from admins where userId = ?";
    const [rows] = await db.query(q, [userId]);
    const row = (rows as currentAdminDBResponse[])[0];
    if (!row) {
      return {
        error: "invaild token",
        success: false,
        role: false,
        userId: "",
      };
    }
    return {
      success: true,
      role: row.role,
      error: "",
      userId,
    };
  } catch (err) {
    console.log(err);
    return {
      error: "invalid token",
      success: false,
      role: false,
      userId: "",
    };
  }
}
