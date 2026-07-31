export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
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
  const nameParts = file.name.split(".");
  if (nameParts.length > 2) {
    return { valid: false, error: "Dosya adı güvenlik nedeniyle reddedildi" };
  }
  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function validateFileServer(file: File): Promise<{ valid: boolean; error?: string; fileName?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
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
