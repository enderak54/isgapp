import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/", "/dashboard", "/personel", "/santiyeler", "/myk", "/operator", "/dosya", "/talimatlar", "/ekipmanlar", "/kazalar", "/egitimler", "/sorumlular", "/ayarlar"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public access to login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth session cookie
  const session = request.cookies.get("sb-access-token");
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
