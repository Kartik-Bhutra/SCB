"use server";
import redis from "@/lib/redis";
import { cookies } from "next/headers";
import { CustomError } from "@/lib/error";
import { redirect } from "next/navigation";
interface session {
  adminType: boolean;
  sid: string;
  userId: string;
  department: string;
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
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const [UIH] = token.split(":");
  await redis.json.del(UIH);
  cookieStore.delete("token");
  redirect("/login");
}
