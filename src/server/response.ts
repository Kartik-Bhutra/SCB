import { NextResponse } from "next/server";
import { STATUS_MAP } from "@/types/serverActions";

export function statusResponse(type: number) {
  const status = STATUS_MAP.get(type);

  if (!status) {
    return NextResponse.json({ error: "Invalid user type" }, { status: 500 });
  }

  if (type === 2) {
    return NextResponse.json({ status, type }, { status: 403 });
  }

  return NextResponse.json({ status, type }, { status: 200 });
}
