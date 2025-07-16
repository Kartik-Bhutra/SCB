import { verify } from "jsonwebtoken";
import { KEY, SECRET } from "@/types/env";
import { CustomError } from "@/lib/error";

export function verifyTokenPayload<T>(token: string, useKey: boolean) {
  const secret = useKey ? KEY : SECRET;

  if (!token) throw new CustomError("Missing token", 400);
  if (!secret) throw new CustomError("Server error", 500);

  try {
    return verify(token, secret) as T;
  } catch {
    throw new CustomError("Unauthorized", 401);
  }
}
