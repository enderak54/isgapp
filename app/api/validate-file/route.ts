import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_SIZE, ALL_ALLOWED_TYPES } from "@/lib/file-validation";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ valid: false, error: "Dosya gönderilmedi" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        valid: false,
        error: `Dosya boyutu 10MB'dan büyük olamaz (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      }, { status: 400 });
    }

    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        valid: false,
        error: `Geçersiz dosya türü: ${file.type || "bilinmiyor"}`,
      }, { status: 400 });
    }

    const nameParts = file.name.split(".");
    if (nameParts.length > 2) {
      return NextResponse.json({
        valid: false,
        error: "Dosya adı güvenlik nedeniyle reddedildi",
      }, { status: 400 });
    }

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (sanitized !== file.name) {
      return NextResponse.json({
        valid: false,
        error: "Dosya adı geçersiz karakterler içeriyor",
      }, { status: 400 });
    }

    return NextResponse.json({ valid: true, fileName: sanitized });
  } catch {
    return NextResponse.json({ valid: false, error: "Dosya doğrulama hatası" }, { status: 500 });
  }
}
