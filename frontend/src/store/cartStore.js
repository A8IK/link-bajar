import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ listingId, siteUrl, orderType, amount, sensitiveNiche, targetSite, anchorText, landingPage, articleDocLink, contentRequirements }]
      add: (item) => {
        const exists = get().items.find((i) => i.listingId === item.listingId);
        if (exists) return;
        set({ items: [...get().items, item] });
      },
      update: (listingId, patch) =>
        set({ items: get().items.map((i) => (i.listingId === listingId ? { ...i, ...patch } : i)) }),
      remove: (listingId) => set({ items: get().items.filter((i) => i.listingId !== listingId) }),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + Number(i.amount || 0), 0),
    }),
    { name: 'lb-cart' },
  ),
);
