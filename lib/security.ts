// XSS Prevention - Strip dangerous content from user input
export const sanitize = (s: string): string => {
  if (!s) return "";
  let r = s;
  // Null byte
  r = r.replace(/\0/g, "");
  // Protocol-based attacks
  r = r.replace(/javascript\s*:/gi, "");
  r = r.replace(/vbscript\s*:/gi, "");
  r = r.replace(/data\s*:\s*text\/html/gi, "");
  r = r.replace(/expression\s*\(/gi, "");
  // Strip all HTML tags (blocks event handlers, SVG onload, etc.)
  r = r.replace(/<[^>]*>/g, "");
  // Decode and re-strip to catch double-encoded attacks
  try {
    const dec = decodeURIComponent(r);
    if (dec !== r) r = dec.replace(/<[^>]*>/g, "");
  } catch {}
  // Max length protection
  if (r.length > 10000) r = r.slice(0, 10000);
  return r.trim();
};

// Sanitize entire form object (recursive, safe for nested objects/arrays)
export const sanitizeForm = <T extends Record<string, unknown>>(form: T): T => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form)) {
    if (typeof value === "string") {
      result[key] = sanitize(value);
    } else if (typeof value === "boolean") {
      result[key] = !!value;
    } else if (typeof value === "number") {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitize(item) : item
      );
    } else if (value && typeof value === "object") {
      result[key] = sanitizeForm(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

// Mask TC Kimlik No for display (KVKK compliance)
export const maskTC = (tc: string): string => {
  if (!tc || tc.length !== 11) return tc || "-";
  return tc.slice(0, 3) + "*****" + tc.slice(-3);
};

// Validate TC Kimlik No checksum
export const validateTC = (tc: string): boolean => {
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === "0") return false;

  const digits = tc.split("").map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const digit10 = (oddSum * 7 - evenSum) % 10;
  if (digit10 !== digits[9]) return false;

  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = totalSum % 10;
  if (digit11 !== digits[10]) return false;

  return true;
};

// Content Security Policy nonce generator
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};

// ===== Field-Level Encryption (Web Crypto API) =====

let cachedKey: CryptoKey | null = null;

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret.padEnd(32, "X").slice(0, 32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("isg-field-encryption"), iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptField(value: string, secret: string): Promise<string> {
  if (!value) return "";
  const key = await getEncryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptField(encrypted: string, secret: string): Promise<string> {
  if (!encrypted) return "";
  try {
    const key = await getEncryptionKey(secret);
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

export async function generateEncryptionKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}
