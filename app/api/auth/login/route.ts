import { getDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { loginAdminDB_Response } from "@/types/server";

export async function POST(req: Request) {
  try {
    const formdata = await req.formData();
    const userId = formdata.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "No userId provided" },
        { status: 500 },
      );
    }
    const db = getDB();
    const q = `SELECT passwordHashed, role FROM admins WHERE userId = ?`;
    const [rows] = await db.query(q, [userId]);
    const { passwordHashed, role } = (rows as loginAdminDB_Response[])[0];
    const password = formdata.get("password");
    if (passwordHashed !== password) {
      return NextResponse.json(
        { error: "Incorrect Password" },
        { status: 500 },
      );
    }
    return NextResponse.json({ role }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
