import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UPDATER_URL = process.env.UPDATER_URL || "http://isgapp-updater:9100";
const UPDATER_API_KEY = process.env.UPDATER_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

    if (!UPDATER_API_KEY) {
      return NextResponse.json({ error: "UPDATER_API_KEY tanımlı değil" }, { status: 500 });
    }

    const res = await fetch(`${UPDATER_URL}/status`, {
      headers: { "X-Updater-Key": UPDATER_API_KEY },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("/api/update/status hatası:", err);
    return NextResponse.json(
      { error: "Güncelleme servisine ulaşılamadı (isgapp-updater çalışıyor mu?)" },
      { status: 502 }
    );
  }
}
