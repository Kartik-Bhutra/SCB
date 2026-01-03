import { type NextRequest, NextResponse } from "next/server";
import { client } from "@/db";
import { hashToBuffer } from "@/hooks/hash";

interface reqData {
  mobileNo: string;
  deviceId: string;
}

export async function GET(req: NextRequest) {
  try {
    const { mobileNo, deviceId } = (await req.json()) as reqData;

    if (!mobileNo && !deviceId) {
      return NextResponse.json(
        { error: "Missing mobileNo or deviceId" },
        { status: 400 },
      );
    }

    const redisKey = hashToBuffer(mobileNo).toString("base64") + deviceId;
    const stored = await client.get(redisKey);

    if (!stored) {
      return NextResponse.json({ status: "post request" }, { status: 200 });
    }

    if (stored === "0") {
      return NextResponse.json({ status: "not accepted" }, { status: 200 });
    }

    if (stored === "2") {
      return NextResponse.json({ status: "not authorized" }, { status: 200 });
    }

    return NextResponse.json({ status: "Can try" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
