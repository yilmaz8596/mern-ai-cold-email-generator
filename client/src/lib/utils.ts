import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchWithAuth(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const opts: RequestInit = { credentials: "include", ...init };
  const res = await fetch(input, opts);
  if (res.status !== 401) return res;

  const refreshRes = await fetch("/api/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) return res;

  return fetch(input, opts);
}
