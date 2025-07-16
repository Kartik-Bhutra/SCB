import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const fullUrl = request.nextUrl.pathname;
  const response = NextResponse.next();
  response.headers.set("x-full-url", fullUrl);
  return response;
}

// export const config = {
//   matcher: ["/admin/:path*", "/api/:path*"],
// };
