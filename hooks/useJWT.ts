import { verify } from "jsonwebtoken";
import { KEY, SECRET } from "@/types/env";
import { CustomError } from "@/lib/error";

export function verifyTokenPayload<T>(token: string, useKey: boolean) {
  const secret = useKey ? KEY : SECRET;

  if (!token) throw new CustomError("Missing token", 400);
  if (!secret) throw new CustomError("Missing secret or key", 500);

  try {
    const payload = verify(token, secret) as T;
    return payload;
  } catch {
    throw new CustomError("Invalid token", 401);
  }
}
