import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OpenClawLastSynced } from "./types";

interface OpenClawStoreState {
  selectedProviderId: string | null;
  selectedModelId: string;
  gatewayPort: number;
  lastSynced: OpenClawLastSynced | null;
  setSelectedProviderId: (providerId: string | null) => void;
  setSelectedModelId: (modelId: string) => void;
  setGatewayPort: (port: number) => void;
  setLastSynced: (lastSynced: OpenClawLastSynced | null) => void;
  clearLastSynced: () => void;
}

export const useOpenClawStore = create<OpenClawStoreState>()(
  persist(
    (set) => ({
      selectedProviderId: null,
      selectedModelId: "",
      gatewayPort: 18790,
      lastSynced: null,
      setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setGatewayPort: (gatewayPort) => set({ gatewayPort }),
      setLastSynced: (lastSynced) => set({ lastSynced }),
      clearLastSynced: () => set({ lastSynced: null }),
    }),
    {
      name: "proxycast:openclaw-module",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useOpenClawStore;
