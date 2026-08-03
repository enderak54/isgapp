import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "isg_session";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      await deleteSession(token);
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  } catch (err) {
    console.error("Logout hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
