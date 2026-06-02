import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_MAP) {
    if (now > entry.resetTime) RATE_LIMIT_MAP.delete(key);
  }
}, 60000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/commits")) {
    const now = Date.now();
    const entry = RATE_LIMIT_MAP.get(ip);
    if (entry && now <= entry.resetTime) {
      if (entry.count >= 30) {
        return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
      }
      entry.count++;
    } else {
      RATE_LIMIT_MAP.set(ip, { count: 1, resetTime: now + 60000 });
    }
  }

  const nonce = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
  );

  return response;
}

export const config = {
  matcher: "/:path*",
};
