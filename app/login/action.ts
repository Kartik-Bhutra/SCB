"use server";
import { getDB } from "@/lib/mySQL";
import { cookies } from "next/headers";
import { verify } from "argon2";
import redis from "@/lib/redis";
import { CustomError } from "@/lib/error";
import type { serverActionState } from "@/types/serverActions";
import { randomUUID } from "crypto";
import { createHash } from "@/hooks/useHash";

interface adminDB {
  PH: string;
  adminType: boolean;
  department: string;
}

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
      "SELECT PH, adminType, department FROM admins WHERE userId = ?",
      [userId],
    );

    const row = (rows as adminDB[])[0];
    if (!row) {
      throw new CustomError("Invalid credentials", 401);
    }

    const { PH, adminType, department } = row;
    const isMatch = await verify(PH, password);
    if (!isMatch) {
      throw new CustomError("Invalid credentials", 401);
    }

    const sid = randomUUID();
    const UIH = createHash(userId);
    const token = `${UIH}:${sid}`;
    const status = await redis.json.set(UIH, "$", {
      sid,
      adminType,
      userId,
      department,
    });

    if (status !== "OK") {
      throw new CustomError("Server Error", 500);
    }

    await redis.expire(UIH, 60 * 60 * 24);

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
