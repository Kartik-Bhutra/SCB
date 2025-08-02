import { CustomError } from "@/lib/error";
import { DecodedIdToken } from "firebase-admin/auth";
import { createHash } from "@/hooks/useHash";
import { getDB } from "@/lib/mySQL";
import { auth } from "@/lib/firebase";
import redis from "@/lib/redis";

interface verify extends DecodedIdToken {
  sid: string;
}

interface clientToken {
  token: string;
  userType: string;
}

export async function mobileAuth(idToken: string) {
  try {
    if (!idToken) {
      throw new CustomError("Fill user details", 400);
    }
    const [MNH, sid] = idToken.split(":");
    const data = (await redis.json.get(MNH)) as clientToken | null;
    if (data) {
      if (data.token !== sid) {
        throw new CustomError("Unauthorized", 401);
      }
      return {
        success: true,
        error: "",
        userType: data.userType,
      };
    }

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT userType, token FROM clients WHERE MNH = ?",
      [MNH],
    );
    const { token, userType } = (rows as clientToken[])[0];
    if (token !== sid) {
      throw new CustomError("Unauthorized", 401);
    }

    await redis.json.set(MNH, "$", {
      token: token,
      userType,
    });

    await redis.expire(MNH, 60 * 60 * 24);

    return {
      success: true,
      error: "",
      userType,
    };
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      userType: 0,
    };
  }
}
