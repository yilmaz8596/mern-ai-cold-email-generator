import create from "zustand";
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
  historyLoaded: boolean;
  generate: (params: GenerateParams) => Promise<GenerateEmailResponse>;
  fetchHistory: () => Promise<void>;
  addHistory: (item: EmailItem) => void;
  updateHistory: (
    id: string,
    patch: Partial<Pick<EmailItem, "subject" | "emailBody">>,
  ) => void;
  removeHistory: (id: string) => Promise<void>;
  clearHistory: () => void;
};

export const useAiStore = create<AiStore>()((set) => ({
  history: [],
  historyLoaded: false,

  generate: async ({ product, audience, tone, length }) => {
    const prompt = `Product/Service: ${product}\nTarget Audience: ${audience}\nTone: ${tone}\nLength: ${length}`;

    const res = await fetchWithAuth("/api/ai/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, product, audience, tone, length }),
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

  fetchHistory: async () => {
    const res = await fetchWithAuth("/api/ai/history");
    if (!res.ok) return;
    const data = await res.json().catch(() => ({ history: [] }));
    set({ history: data.history ?? [], historyLoaded: true });
  },

  addHistory: (item) => set((s) => ({ history: [item, ...s.history] })),

  updateHistory: (id, patch) =>
    set((s) => ({
      history: s.history.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    })),

  removeHistory: async (id) => {
    await fetchWithAuth(`/api/ai/history/${id}`, { method: "DELETE" });
    set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
  },

  clearHistory: () => set({ history: [], historyLoaded: false }),
}));

export default useAiStore;

