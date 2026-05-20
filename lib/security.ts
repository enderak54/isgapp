export const sanitize = (s: string): string => s.replace(/[<>]/g, "").trim();

export const sanitizeForm = <T extends Record<string, unknown>>(form: T): T => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form)) {
    if (typeof value === "string") {
      result[key] = sanitize(value);
    } else if (typeof value === "boolean") {
      result[key] = !!value;
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

export const maskTC = (tc: string): string => {
  if (tc.length !== 11) return tc;
  return "********" + tc.slice(-3);
};
