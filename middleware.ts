import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();

  response.headers.set("x-full-url", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
