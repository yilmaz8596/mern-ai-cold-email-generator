import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Drop-in replacement for `fetch` that automatically attempts a silent
 * token refresh when a protected endpoint returns 401, then retries the
 * original request once.  Cookies are always sent (`credentials: "include"`).
 */
export async function fetchWithAuth(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const opts: RequestInit = { credentials: "include", ...init };
  const res = await fetch(input, opts);
  if (res.status !== 401) return res;

  // Try to get a fresh access token using the http-only refresh token cookie.
  const refreshRes = await fetch("/api/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  // If the refresh also fails (e.g. refresh token expired) return the
  // original 401 so the caller / UI can redirect to login.
  if (!refreshRes.ok) return res;

  // Retry the original request with the new access token cookie.
  return fetch(input, opts);
}
