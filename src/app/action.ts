"use server";

import { cookies } from "next/headers";
import { client } from "@/db";

export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return false;
  }
  const key = token.slice(0, 44);
  await client.del(key);
  cookieStore.delete("token");
  return true;
}
