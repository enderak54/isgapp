import { NextRequest, NextResponse } from "next/server";
import { getUserBySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "isg_session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const user = await getUserBySession(token);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error("/api/auth/me hatası:", err);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
