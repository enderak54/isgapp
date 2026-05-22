import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const response = NextResponse.next();

  response.headers.set("x-csp-nonce", nonce);

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `connect-src 'self' https://*.supabase.co https://api.github.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: "/:path*",
};
