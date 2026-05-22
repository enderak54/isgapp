import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

export const config = {
  matcher: "/:path*",
};
