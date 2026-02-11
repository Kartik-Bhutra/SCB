import { cookies } from "next/headers";
import { redis } from "@/db/index";

export async function isAuthorized(): Promise<null | boolean> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return null;
    }

    const parts = token.split(":");
    if (parts.length !== 2) {
      return null;
    }

    const [key, value] = parts;
    const stored = await redis.get(key);
    if (!stored) {
      return null;
    }

    const { sessionId, type } = JSON.parse(stored);
    if (sessionId === value) {
      return type;
    }

    return null;
  } catch {
    return null;
  }
}

export async function isAdmin() {
  const isLoggedIn = await isAuthorized();
  if (!isLoggedIn) return false;
  return true;
}

export async function isManager() {
  const isLoggedIn = await isAuthorized();
  console.log(isLoggedIn);
  if (isLoggedIn === false) return true;
  return false;
}
