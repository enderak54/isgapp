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

export async function setCsrfCookie(): Promise<string> {
  const token = generateToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
  return token;
}

export async function validateCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== TOKEN_LENGTH || headerToken.length !== TOKEN_LENGTH) return false;
  return cookieToken === headerToken;
}

export { CSRF_HEADER, CSRF_COOKIE };
