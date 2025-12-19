import { cookies } from "next/headers";
import { client } from "@/db/index";

export async function check(length : number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return false;
  }
  const key = token.slice(0, 44);
  const value = token.slice(44);
  
  if (value.length !== length) return false;
  const stored = await client.get(key);

  if (!stored) {
    return false;
  }

  return stored === value;
}
