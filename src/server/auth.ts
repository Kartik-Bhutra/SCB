import { cookies } from "next/headers";
import { redis } from "@/db/index";

interface SessionData {
  sessionId: string;
  type: boolean;
  userId: string;
}

async function resolveSession(): Promise<SessionData | null> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return null;

    const parts = token.split(":");
    if (parts.length !== 2) return null;

    const [key, value] = parts;

    const stored = await redis.get(key);
    if (!stored) return null;

    const parsed: SessionData = JSON.parse(stored);

    if (parsed.sessionId !== value) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function isAuthorized(): Promise<null | boolean> {
  const session = await resolveSession();
  if (!session) return null;
  return session.type;
}

export async function isAdmin(): Promise<boolean> {
  const session = await resolveSession();
  if (!session) return false;
  return session.type === true;
}

export async function isManager(): Promise<boolean> {
  const session = await resolveSession();
  if (!session) return false;
  return session.type === false;
}

export async function getAdmin(): Promise<string | null> {
  const session = await resolveSession();
  if (!session || session.type !== true) return null;
  return session.userId;
}
