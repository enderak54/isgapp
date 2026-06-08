const CSRF_HEADER = "x-csrf-token";

let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

export async function getCsrfToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = (async () => {
    try {
      const res = await fetch("/api/csrf-token");
      if (!res.ok) return null;
      const data = await res.json();
      cachedToken = data.token;
      return cachedToken;
    } catch {
      return null;
    } finally {
      tokenPromise = null;
    }
  })();
  return tokenPromise;
}

export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getCsrfToken();
  const headers = new Headers(options.headers);
  if (token) headers.set(CSRF_HEADER, token);
  return fetch(url, { ...options, headers });
}
