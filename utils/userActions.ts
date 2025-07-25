"use server";
import redis from "@/lib/redis";
import { cookies } from "next/headers";
import { CustomError } from "@/lib/error";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { createHash } from "@/hooks/useHash";
import { getDB } from "@/lib/mySQL";
interface session {
  adminType: boolean;
  sid: string;
  userId: string;
  department: string;
}

interface verify extends DecodedIdToken {
  sid: string;
}

interface clientToken {
  token: string;
  userType: string;
}

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) throw new CustomError("Unauthorized", 401);

    const [UIH, sid] = token.split(":");

    const cachedToken = (await redis.json.get(UIH)) as session | null;
    if (!cachedToken || cachedToken.sid !== sid)
      throw new CustomError("Unauthorized", 401);

    return {
      success: true,
      error: "",
      adminType: cachedToken.adminType,
      userId: cachedToken.userId,
      department: cachedToken.department,
    };
  } catch (err) {
    return {
      success: false,
      adminType: false,
      userId: "",
      error: err instanceof CustomError ? err.message : "something went wrong",
      department: "",
    };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) throw new CustomError("Unauthorized", 401);

    const [userId] = token.split(":");
    await redis.json.del(userId);
    cookieStore.delete("token");
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

export async function mobileAuth(idToken: string) {
  try {
    if (!idToken) {
      throw new CustomError("Fill user details", 400);
    }
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const { phone_number, sid } = decoded as verify;
    if (!phone_number) {
      throw new CustomError("Invalid credentials", 401);
    }
    const MNH = createHash(phone_number);
    const data = (await redis.json.get(MNH)) as clientToken | null;
    if (data) {
      if (data.token !== sid) {
        throw new CustomError("Unauthorized", 401);
      }
      return {
        success: true,
        error: "",
        userType: data.userType,
      };
    }

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT userType, token FROM clients WHERE MNH = ?",
      [MNH],
    );
    const { token, userType } = (rows as clientToken[])[0];
    if (token !== sid) {
      throw new CustomError("Unauthorized", 401);
    }

    return {
      success: true,
      error: "",
      userType,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      userType: 0,
    };
  }
}
