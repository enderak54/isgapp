import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseOrigin = "";
try {
  supabaseOrigin = new URL(SUPABASE_URL).origin;
} catch {
  supabaseOrigin = "";
}

const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_MAP) {
    if (now > entry.resetTime) RATE_LIMIT_MAP.delete(key);
  }
}, 60000);

const CSRF_HEADER = "x-csrf-token";
const CSRF_SKIP_PATHS = ["/api/commits", "/api/csrf-token", "/api/validate-file"];

function generateCsrfToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) token += chars[array[i] % chars.length];
  return token;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

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

    // CSRF validation for state-changing API requests
    if (STATE_CHANGING.has(method) && !CSRF_SKIP_PATHS.some(p => pathname.startsWith(p))) {
      const cookieToken = request.cookies.get("csrf-token")?.value;
      const headerToken = request.headers.get(CSRF_HEADER);
      if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
        return NextResponse.json({ error: "CSRF token geçersiz" }, { status: 403 });
      }
    }
  }

  const nonce = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set CSRF cookie if not present
  if (!request.cookies.has("csrf-token")) {
    const token = generateCsrfToken();
    const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol).replace(/:$/, "");
    response.cookies.set("csrf-token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" && proto === "https",
      path: "/",
      maxAge: 3600,
    });
  }

  // Allow the configured Supabase origin (hosted or self-hosted) in CSP so that
  // API calls and storage previews are not blocked when Supabase runs on a
  // different origin than the app (e.g. self-host kong on :8000).
  const connectSrc = ["'self'", "https://*.supabase.co", "https://api.github.com"];
  if (supabaseOrigin) connectSrc.push(supabaseOrigin);
  const imgSrc = ["'self'", "data:", "blob:"];
  if (supabaseOrigin) imgSrc.push(supabaseOrigin);

  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src ${imgSrc.join(" ")}; connect-src ${connectSrc.join(" ")}; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
  );

  return response;
}

export const config = {
  matcher: "/:path*",
};
