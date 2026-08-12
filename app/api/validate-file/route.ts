import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MAX_FILE_SIZE, ALL_ALLOWED_TYPES, FILE_SIZE_EXEMPT_SETTINGS_KEY } from "@/lib/file-validation";

const MAGIC_BYTES: { type: string; signatures: Array<Array<number | "skip">> }[] = [
  {
    type: "image/jpeg",
    signatures: [
      [0xff, 0xd8, 0xff],
    ],
  },
  {
    type: "image/png",
    signatures: [
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    ],
  },
  {
    type: "image/gif",
    signatures: [
      [0x47, 0x49, 0x46, 0x38],
    ],
  },
  {
    type: "image/webp",
    signatures: [
      [0x52, 0x49, 0x46, 0x46, "skip", "skip", "skip", "skip", 0x57, 0x45, 0x42, 0x50],
    ],
  },
  {
    type: "application/pdf",
    signatures: [
      [0x25, 0x50, 0x44, 0x46],
    ],
  },
  {
    type: "application/zip",
    signatures: [
      [0x50, 0x4b, 0x03, 0x04],
      [0x50, 0x4b, 0x05, 0x06],
      [0x50, 0x4b, 0x07, 0x08],
    ],
  },
];

const ZIP_BASED: string[] = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function matchesSignature(buffer: Uint8Array, signature: Array<number | "skip">): boolean {
  for (let i = 0; i < signature.length; i++) {
    const expected = signature[i];
    if (expected === "skip") continue;
    if (buffer[i] !== expected) return false;
  }
  return true;
}

function detectRealType(buffer: Uint8Array): string | null {
  for (const { type, signatures } of MAGIC_BYTES) {
    if (signatures.some(sig => matchesSignature(buffer, sig))) return type;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const area = (formData.get("area") as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ valid: false, error: "Dosya gönderilmedi" }, { status: 400 });
    }

    // Sunucu tarafında muaf alan listesini DB'den oku (authoritative kontrol).
    let sizeExempt = false;
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.from("ayarlar").select("value").eq("key", FILE_SIZE_EXEMPT_SETTINGS_KEY).maybeSingle();
      const list = data?.value ? JSON.parse(data.value) : [];
      if (Array.isArray(list) && area) {
        sizeExempt = list.includes(area);
      }
    } catch {
      // Ayar okunamazsa güvenli varsayılan: sınır uygulanır.
    }

    if (!sizeExempt && file.size > MAX_FILE_SIZE) {
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

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const buffer = new Uint8Array(await file.arrayBuffer());
    const realType = detectRealType(buffer);

    if (!realType) {
      return NextResponse.json({
        valid: false,
        error: "Dosya içeriği tanınamıyor veya desteklenmiyor",
      }, { status: 400 });
    }

    const isDocXls = file.type === "text/plain";
    if (!isDocXls && realType === "application/zip" && !ZIP_BASED.includes(file.type)) {
      return NextResponse.json({
        valid: false,
        error: "Dosya içeriği izin verilen türle eşleşmiyor (docx/xlsx bekleniyordu)",
      }, { status: 400 });
    }

    if (!isDocXls && !ZIP_BASED.includes(file.type) && realType !== file.type) {
      return NextResponse.json({
        valid: false,
        error: `Dosya içeriği bildirilen türle eşleşmiyor (${realType} vs ${file.type})`,
      }, { status: 400 });
    }

    return NextResponse.json({ valid: true, fileName: sanitized, detectedType: realType });
  } catch {
    return NextResponse.json({ valid: false, error: "Dosya doğrulama hatası" }, { status: 500 });
  }
}
