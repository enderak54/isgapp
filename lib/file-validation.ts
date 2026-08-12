import { supabase } from "@/lib/supabase";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Dosya boyutu sınırının uygulanmayacağı alanları tutan ayar anahtarı.
// Değer: JSON string[] (bucket/alan adları).
export const FILE_SIZE_EXEMPT_SETTINGS_KEY = "dosya_boyut_haric_alanlar";

// Yükleme yapılan alanlar (storage bucket adlarıyla birebir).
export const FILE_UPLOAD_AREAS = {
  personel: "personel-belgeleri",
  egitim: "egitim-dosyalari",
  ekipman: "ekipman-dosyalari",
  ihtar: "ihtar-dosyalari",
  kaza: "kaza-dosyalari",
  santiye: "santiye-dosyalari",
} as const;

let sizeExemptAreasCache: Set<string> | null = null;

// Muaf alan listesini DB'den yükler ve önbelleğe alır (client tarafı için).
export async function loadFileSizeExemptAreas(): Promise<Set<string>> {
  if (sizeExemptAreasCache) return sizeExemptAreasCache;
  try {
    const { data } = await supabase.from("ayarlar").select("value").eq("key", FILE_SIZE_EXEMPT_SETTINGS_KEY).maybeSingle();
    const list = data?.value ? JSON.parse(data.value) : [];
    sizeExemptAreasCache = new Set(Array.isArray(list) ? list : []);
  } catch {
    sizeExemptAreasCache = new Set();
  }
  return sizeExemptAreasCache;
}

export function isFileSizeExempt(area?: string): boolean {
  return !!area && !!sizeExemptAreasCache && sizeExemptAreasCache.has(area);
}

export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
};

export const ALL_ALLOWED_TYPES = [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents];

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];

export function validateFile(file: File, area?: string): { valid: boolean; error?: string } {
  if (!isFileSizeExempt(area) && file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Dosya boyutu 10MB'dan büyük olamaz (${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }
  if (file.type && !ALL_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Geçersiz dosya türü" };
  }
  if (!file.type) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: "Geçersiz dosya türü" };
    }
  }
  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function validateFileServer(file: File, area?: string): Promise<{ valid: boolean; error?: string; fileName?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (area) formData.append("area", area);
    const res = await fetch("/api/validate-file", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data as { valid: boolean; error?: string; fileName?: string };
  } catch {
    return { valid: false, error: "Dosya doğrulama sunucusuna ulaşılamadı" };
  }
}
