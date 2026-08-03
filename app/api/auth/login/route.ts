import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { sanitize } from "@/lib/security";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "isg_session";

export async function POST(request: NextRequest) {
  try {
    let body: { username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const username = sanitize(body.username || "");
    const password = body.password || "";
    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre gereklidir" }, { status: 400 });
    }

    const user = await authenticate(username, password);
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }

    const token = await createSession(user.id);
    const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol).replace(/:$/, "");

    const response = NextResponse.json({ user: { id: user.id, username: user.username, ad_soyad: user.ad_soyad, rol: user.rol } });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" && proto === "https",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (err) {
    console.error("Login hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
