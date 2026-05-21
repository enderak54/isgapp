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

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Dosya boyutu 10MB'dan büyük olamaz (${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Geçersiz dosya türü" };
  }
  // Check for double extension attacks
  const nameParts = file.name.split(".");
  if (nameParts.length > 2) {
    return { valid: false, error: "Dosya adı güvenlik nedeniyle reddedildi" };
  }
  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
