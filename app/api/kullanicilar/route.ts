import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createUser, listUsers, auditLogPg } from "@/lib/auth";
import { sanitize } from "@/lib/security";

export const dynamic = "force-dynamic";

const GECERLI_ROLLER = ["admin", "kullanici"];

function requestIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error("Kullanıcı listesi hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

    let body: { username?: string; password?: string; ad_soyad?: string; rol?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const username = sanitize(body.username || "");
    const password = body.password || "";
    const adSoyad = sanitize(body.ad_soyad || "") || null;
    const rol = GECERLI_ROLLER.includes(body.rol || "") ? (body.rol as string) : "kullanici";

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre gereklidir" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
    }

    const user = await createUser(username, password, adSoyad || "", rol);
    await auditLogPg({
      tableName: "app_users",
      action: "INSERT",
      recordId: user.id,
      newValues: { username: user.username, ad_soyad: user.ad_soyad, rol: user.rol },
      actor: admin.username,
      ip: requestIp(request),
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate key")) {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 409 });
    }
    console.error("Kullanıcı oluşturma hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
