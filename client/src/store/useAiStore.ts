import create from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type EmailItem, type GenerateEmailResponse, ApiError } from "../types";
import { fetchWithAuth } from "../lib/utils";

export type { EmailItem };

type GenerateParams = {
  product: string;
  audience: string;
  tone: string;
  length: string;
};

type AiStore = {
  history: EmailItem[];
  generate: (params: GenerateParams) => Promise<GenerateEmailResponse>;
  addHistory: (item: EmailItem) => void;
  updateHistory: (
    id: string,
    patch: Partial<Pick<EmailItem, "subject" | "emailBody">>,
  ) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
};

export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      history: [],

      generate: async ({ product, audience, tone, length }) => {
        const prompt = `Product/Service: ${product}\nTarget Audience: ${audience}\nTone: ${tone}\nLength: ${length}`;

        const res = await fetchWithAuth("/api/ai/generate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new ApiError(
            res.status,
            (data as { message?: string }).message ??
              "Failed to generate email",
          );
        }

        return data as GenerateEmailResponse;
      },

      addHistory: (item) => set((s) => ({ history: [item, ...s.history] })),

      updateHistory: (id, patch) =>
        set((s) => ({
          history: s.history.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      removeHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "mailify-ai",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ history: s.history }),
    },
  ),
);

export default useAiStore;
