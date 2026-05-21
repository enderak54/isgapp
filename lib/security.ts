// XSS Prevention - Strip dangerous HTML tags and attributes
export const sanitize = (s: string): string => {
  if (!s) return "";
  return s
    .replace(/[<>]/g, "") // Strip HTML tags
    .replace(/javascript:/gi, "") // Strip javascript: protocol
    .replace(/on\w+=/gi, "") // Strip event handlers
    .trim();
};

// Sanitize entire form object
export const sanitizeForm = <T extends Record<string, unknown>>(form: T): T => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form)) {
    if (typeof value === "string") {
      result[key] = sanitize(value);
    } else if (typeof value === "boolean") {
      result[key] = !!value;
    } else if (typeof value === "number") {
      result[key] = value;
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

// Rate limiting helper (client-side)
const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(key);

  if (!entry || now > entry.resetTime) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
};

// Content Security Policy nonce generator
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};
