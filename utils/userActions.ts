"use server";

import { createHash } from "@/hooks/useHash";
import { verifyToken } from "@/hooks/useJWT";
import redis from "@/lib/redis";
import { adminStat } from "@/types/serverActions";
import { cookies } from "next/headers";
import { CustomError } from "@/lib/error";

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) throw new CustomError("Unauthorized", 401);

    const { userId, role } = verifyToken<adminStat>(token, true);

    const userIdHashed = createHash(userId);
    const cachedToken = await redis.get(userIdHashed);
    if (!cachedToken || cachedToken !== token)
      throw new CustomError("Unauthorized", 401);

    return { success: true, error: "", role, userId };
  } catch (err) {
    console.error(err);
    if (err instanceof CustomError) {
      return {
        success: false,
        error: err.message,
        role: false,
        userId: "",
      };
    }
    return {
      success: false,
      error: "something went wrong",
      role: false,
      userId: "",
    };
  }
}
