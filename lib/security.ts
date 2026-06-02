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
  return "********" + tc.slice(-3);
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

// Simple XOR encryption for sensitive fields (client-side only, not for production)
// For production, use server-side encryption with proper key management
const XOR_KEY = 0x5A;

export const encryptField = (value: string): string => {
  if (!value) return "";
  return value
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY))
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
};

export const decryptField = (encrypted: string): string => {
  if (!encrypted) return "";
  const bytes: number[] = [];
  for (let i = 0; i < encrypted.length; i += 2) {
    bytes.push(parseInt(encrypted.slice(i, i + 2), 16));
  }
  return bytes.map((b) => String.fromCharCode(b ^ XOR_KEY)).join("");
};

// Content Security Policy nonce generator
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};
