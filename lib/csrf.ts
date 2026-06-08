"use server";

import { cookies } from "next/headers";

const TOKEN_LENGTH = 32;
const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

export async function validateCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== TOKEN_LENGTH || headerToken.length !== TOKEN_LENGTH) return false;
  const bufA = new TextEncoder().encode(cookieToken);
  const bufB = new TextEncoder().encode(headerToken);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export { CSRF_HEADER, CSRF_COOKIE };
