"use server";

import { cookies } from "next/headers";
import { redis } from "@/db";

export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return false;
  }
  const key = token.slice(0, 44);
  await redis.del(key);
  cookieStore.delete("token");
  return true;
}
