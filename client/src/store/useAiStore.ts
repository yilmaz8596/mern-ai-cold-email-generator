import create from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type EmailItem, type GenerateEmailResponse, ApiError } from "../types";

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
  clearHistory: () => void;
};

export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      history: [],

      generate: async ({ product, audience, tone, length }) => {
        const prompt = `Product/Service: ${product}\nTarget Audience: ${audience}\nTone: ${tone}\nLength: ${length}`;

        const res = await fetch("/api/ai/generate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
