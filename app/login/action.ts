"use server";
import { getDB } from "@/lib/mySQL";
import { cookies } from "next/headers";
import { verify } from "argon2";
import redis from "@/lib/redis";
import { CustomError } from "@/lib/error";
import type { adminDB, serverActionState } from "@/types/serverActions";
import { randomUUID } from "crypto";

export default async function handleLogin(
  _: serverActionState,
  formdata: FormData,
): Promise<serverActionState> {
  try {
    const userId = formdata.get("userId")?.toString().trim();
    const password = formdata.get("password")?.toString().trim();

    if (!userId || !password) {
      throw new CustomError("Fill user details", 400);
    }

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT passwordHashed, role FROM admins WHERE userId = ?",
      [userId],
    );

    const row = (rows as adminDB[])[0];
    if (!row) {
      throw new CustomError("Invalid credentials", 401);
    }

    const { passwordHashed, role } = row;
    const isMatch = await verify(passwordHashed, password);
    if (!isMatch) {
      throw new CustomError("Invalid credentials", 401);
    }

    const sid = randomUUID();
    const token = `${userId}:${sid}`;
    await redis.json.set(userId, "$", {
      sid,
      role,
    });
    await redis.expire(userId, 60 * 60 * 24);

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      priority: "low",
      maxAge: 60 * 60 * 24,
    });

    return {
      success: true,
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
    };
  }
}
