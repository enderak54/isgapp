import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, updateUser, deleteUser, listUsers, auditLogPg } from "@/lib/auth";
import { sanitize } from "@/lib/security";

export const dynamic = "force-dynamic";

const GECERLI_ROLLER = ["admin", "kullanici"];

function requestIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

    const { id } = await params;

    let body: { ad_soyad?: string; rol?: string; aktif?: boolean; sifre?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    // Kullanıcı kendini pasifleştiremez veya admin rolünü değiştiremez.
    if (admin.id === id && (body.aktif === false || (body.rol && body.rol !== "admin"))) {
      return NextResponse.json({ error: "Kendi hesabınızı pasifleştiremez veya rolünüzü değiştiremezsiniz" }, { status: 400 });
    }

    const fields: { ad_soyad?: string | null; rol?: string; aktif?: boolean; password?: string } = {};
    if (body.ad_soyad !== undefined) fields.ad_soyad = sanitize(body.ad_soyad) || null;
    if (body.rol !== undefined) {
      if (!GECERLI_ROLLER.includes(body.rol)) {
        return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
      }
      fields.rol = body.rol;
    }
    if (body.aktif !== undefined) fields.aktif = !!body.aktif;
    if (body.sifre) {
      if (body.sifre.length < 8) {
        return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
      }
      fields.password = body.sifre;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
    }

    const before = (await listUsers()).find((u) => u.id === id);
    if (!before) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

    await updateUser(id, fields);

    const after = (await listUsers()).find((u) => u.id === id);
    await auditLogPg({
      tableName: "app_users",
      action: "UPDATE",
      recordId: id,
      oldValues: { username: before.username, ad_soyad: before.ad_soyad, rol: before.rol, aktif: before.aktif },
      newValues: after ? { username: after.username, ad_soyad: after.ad_soyad, rol: after.rol, aktif: after.aktif } : null,
      actor: admin.username,
      ip: requestIp(request),
    });
    return NextResponse.json({ user: after });
  } catch (err) {
    console.error("Kullanıcı güncelleme hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

    const { id } = await params;

    if (admin.id === id) {
      return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz" }, { status: 400 });
    }

    const before = (await listUsers()).find((u) => u.id === id);
    if (!before) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

    const silindi = await deleteUser(id);
    if (!silindi) return NextResponse.json({ error: "Kullanıcı silinemedi" }, { status: 404 });

    await auditLogPg({
      tableName: "app_users",
      action: "DELETE",
      recordId: id,
      oldValues: { username: before.username, ad_soyad: before.ad_soyad, rol: before.rol },
      actor: admin.username,
      ip: requestIp(request),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Kullanıcı silme hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
