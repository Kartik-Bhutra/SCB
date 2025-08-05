import { CustomError } from "@/lib/error";
import { getDB } from "@/lib/mySQL";

interface clientToken {
  token: string;
  userType: number;
}

export async function mobileAuth(idToken: string) {
  try {
    if (!idToken) {
      throw new CustomError("Fill user details", 400);
    }
    const [MNH, sid] = idToken.split(":");

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT userType, token FROM clients WHERE MNH = ?",
      [MNH],
    );
    const { token, userType } = (rows as clientToken[])[0];
    if (token !== sid) {
      throw new CustomError("Unauthorized", 401);
    }

    return {
      success: true,
      error: "",
      userType,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof CustomError ? err.message : "something went wrong",
      userType: 0,
    };
  }
}
