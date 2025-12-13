"use server"

import { client } from "@/db";
import { cookies } from "next/headers";

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