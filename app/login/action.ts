"use server";
import { getDB } from "@/lib/db";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";
import { loginAdminDBResponse, LoginState } from "@/types/serverActions";
export default async function handleLogin(
  prevState: LoginState,
  formdata: FormData,
): Promise<LoginState> {
  try {
    const userId = formdata.get("userId")?.toString().trim();
    const password = formdata.get("password")?.toString().trim();
    if (!userId && !password) {
      return {
        error: "Fill user details",
        success: false,
      };
    }
    const db = getDB();
    const q = `SELECT passwordHashed FROM admins WHERE userId = ?`;
    const [rows] = await db.query(q, [userId]);
    const row = (rows as loginAdminDBResponse[])[0];
    if (!row) {
      return {
        error: "Invalid credentials",
        success: false,
      };
    }
    const { passwordHashed } = row;
    if (passwordHashed !== password) {
      return {
        error: "Invalid credentials",
        success: false,
      };
    }
    const secret = process.env.ENCRYPTED_KEY;
    if (!secret) {
      return {
        error: "server error",
        success: false,
      };
    }
    const token = sign({ userId }, secret, {
      expiresIn: "1d",
    });
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
    console.log(err);
    return {
      error: "invalid credentials",
      success: false,
    };
  }
}
