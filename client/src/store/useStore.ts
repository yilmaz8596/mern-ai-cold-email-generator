import create from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type User,
  type EmailItem,
  type BillingTransaction,
  type VerifyOtpResponse,
  ApiError,
} from "../types";
import { fetchWithAuth } from "../lib/utils";

// Re-export types consumed by other modules so existing imports keep working
export type { EmailItem, BillingTransaction };

// ---------------------------------------------------------------------------
// Module-level variable — intentionally NOT in Zustand state so passwords are
// never surfaced in devtools or serialised snapshots.
// ---------------------------------------------------------------------------
type PendingAuth = {
  flow: "register" | "login";
  name: string;
  email: string;
  password: string;
};
let _pending: PendingAuth | null = null;

// ---------------------------------------------------------------------------
// Fetch helper — throws ApiError on non-2xx
// ---------------------------------------------------------------------------
async function apiFetch<T = void>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { message?: string }).message ?? "Request failed",
    );
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
type Store = {
  user: User | null;
  /** Email currently awaiting OTP verification */
  pendingEmail: string | null;
  credits: number;
  history: EmailItem[];
  transactions: BillingTransaction[];

  // Auth actions — all async, throw ApiError on failure
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  /** Re-sends OTP using the credentials stored from the last register/login call */
  resendOtp: () => Promise<void>;
  logout: () => Promise<void>;

  // Legacy helper kept for Topbar / direct user override
  setUser: (u: User | null) => void;

  deductCredits: (chars: number) => boolean;
  addCredits: (amount: number) => void;
  addHistory: (item: EmailItem) => void;
  addTransaction: (tx: BillingTransaction) => void;
  buyCredits: (variantId: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      pendingEmail: null,
      credits: 1000,
      history: [],
      transactions: [],

      register: async (name, email, password) => {
        await apiFetch("/api/auth/register", { name, email, password });
        _pending = { flow: "register", name, email, password };
        set({ pendingEmail: email });
      },

      login: async (email, password) => {
        await apiFetch("/api/auth/login", { email, password });
        _pending = { flow: "login", name: "", email, password };
        set({ pendingEmail: email });
      },

      verifyOtp: async (email, otp) => {
        const data = await apiFetch<VerifyOtpResponse>("/api/auth/verify-otp", {
          email,
          otp,
        });
        _pending = null;
        set({ user: data.user, pendingEmail: null, credits: data.credits });
      },

      resendOtp: async () => {
        if (!_pending)
          throw new ApiError(400, "No pending authentication session.");
        const { flow, name, email, password } = _pending;
        if (flow === "register") {
          await apiFetch("/api/auth/register", { name, email, password });
        } else {
          await apiFetch("/api/auth/login", { email, password });
        }
      },

      logout: async () => {
        try {
          await apiFetch("/api/auth/logout", {});
        } catch {
          // always clear local state even if the request fails
        }
        _pending = null;
        set({ user: null, pendingEmail: null });
      },

      setUser: (u) => set({ user: u }),

      deductCredits: (chars) => {
        const creditsNeeded = Math.ceil(chars / 100);
        const { credits } = get();
        if (credits < creditsNeeded) return false;
        set((s) => ({ credits: s.credits - creditsNeeded }));
        return true;
      },
      addHistory: (item) => set((s) => ({ history: [item, ...s.history] })),
      addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),
      addTransaction: (tx) =>
        set((s) => ({ transactions: [tx, ...s.transactions] })),

      buyCredits: async (variantId) => {
        const res = await fetchWithAuth("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId,
            redirectUrl: `${window.location.origin}/dashboard/billing?success=true`,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new ApiError(
            res.status,
            (data as { message?: string }).message ?? "Checkout failed",
          );
        window.location.href = (data as { url: string }).url;
      },

      refreshCredits: async () => {
        const res = await fetchWithAuth("/api/billing/credits");
        if (!res.ok) throw new Error("credits_fetch_failed");
        const { credits } = await res.json();
        set({ credits });
      },
    }),
    {
      name: "mailify-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist user and credits — keep history/transactions session-only
      // and never persist pendingEmail (in-flight OTP state).
      partialize: (s) => ({ user: s.user, credits: s.credits }),
    },
  ),
);

export default useStore;
