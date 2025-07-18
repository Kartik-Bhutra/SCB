"use server";
import redis from "@/lib/redis";
import { cookies } from "next/headers";
import { CustomError } from "@/lib/error";
import { session } from "@/types/serverActions";

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) throw new CustomError("Unauthorized", 401);

    const [userId, sid] = token.split(":");

    const cachedToken = (await redis.json.get(userId)) as session | null;
    if (!cachedToken || cachedToken.sid !== sid)
      throw new CustomError("Unauthorized", 401);

    return { success: true, error: "", role: cachedToken.role, userId };
  } catch (err) {
    return {
      success: false,
      role: false,
      userId: "",
      error: err instanceof CustomError ? err.message : "something went wrong",
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
