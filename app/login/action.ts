"use server";
import { getDB } from "@/lib/mySQL";
import { cookies } from "next/headers";
import { verify } from "argon2";
import redis from "@/lib/redis";
import { signToken } from "@/hooks/useJWT";
import { createHash } from "@/hooks/useHash";
import { CustomError } from "@/lib/error";
import type { adminDB, adminStat, LoginState } from "@/types/serverActions";

export default async function handleLogin(
  _: LoginState,
  formdata: FormData,
): Promise<LoginState> {
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

    const token = signToken<adminStat>({ userId, role }, true);

    const userIdHashed = createHash(userId);
    await redis.set(userIdHashed, token, { EX: 60 * 60 * 24 });

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
    if (err instanceof CustomError) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: false,
      error: "Something went wrong",
    };
  }
}
