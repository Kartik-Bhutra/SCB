import { cookies } from "next/headers";
import { client } from "@/db/index";

export async function verify() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return false;
  }
  const key = token.slice(0, 44);
  const value = token.slice(44);
  const stored = await client.get(key);

  if (!stored) {
    return false;
  }

  return stored === value;
}
