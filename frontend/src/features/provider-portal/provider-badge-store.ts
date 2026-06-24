import { create } from 'zustand';

type BadgeState = {
  marketplace: number;
  direct: number;
  profileId: string | null;
  setProfileId: (id: string) => void;
  setMarketplace: (n: number) => void;
  setDirect: (n: number) => void;
  incrementMarketplace: () => void;
  incrementDirect: () => void;
  clearMarketplace: () => void;
  clearDirect: () => void;
};

export const useProviderBadgeStore = create<BadgeState>((set) => ({
  marketplace: 0,
  direct: 0,
  profileId: null,
  setProfileId: (id) => set({ profileId: id }),
  setMarketplace: (n) => set({ marketplace: n }),
  setDirect: (n) => set({ direct: n }),
  incrementMarketplace: () => set((s) => ({ marketplace: s.marketplace + 1 })),
  incrementDirect: () => set((s) => ({ direct: s.direct + 1 })),
  clearMarketplace: () => set({ marketplace: 0 }),
  clearDirect: () => set({ direct: 0 }),
}));
