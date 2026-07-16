"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  dishId: string;
  venueId: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
  quantity: number;
  comment: string;
}

interface CartState {
  items: CartItem[];
  venueId: string | null;
  venueSlug: string | null;
  tableCode: string | null;
  isOpen: boolean;

  addItem: (item: Omit<CartItem, "quantity" | "comment">) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, delta: number) => void;
  updateComment: (dishId: string, comment: string) => void;
  setTable: (code: string) => void;
  clearTable: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      venueId: null,
      venueSlug: null,
      tableCode: null,
      isOpen: false,

      addItem(newItem) {
        const { items, venueId } = get();

        // Если заказ из другого заведения — очищаем корзину
        if (venueId && venueId !== newItem.venueId) {
          set({
            items: [{ ...newItem, quantity: 1, comment: "" }],
            venueId: newItem.venueId,
          });
          return;
        }

        const exists = items.find((i) => i.dishId === newItem.dishId);
        if (exists) {
          set({
            items: items.map((i) =>
              i.dishId === newItem.dishId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...newItem, quantity: 1, comment: "" }],
            venueId: newItem.venueId,
          });
        }
      },

      removeItem(dishId) {
        const items = get().items.filter((i) => i.dishId !== dishId);
        set({ items, venueId: items.length ? get().venueId : null });
      },

      updateQuantity(dishId, delta) {
        const items = get().items
          .map((i) =>
            i.dishId === dishId ? { ...i, quantity: i.quantity + delta } : i
          )
          .filter((i) => i.quantity > 0);
        set({ items, venueId: items.length ? get().venueId : null });
      },

      updateComment(dishId, comment) {
        set({
          items: get().items.map((i) =>
            i.dishId === dishId ? { ...i, comment } : i
          ),
        });
      },

      setTable(code) {
        set({ tableCode: code });
      },

      clearTable() {
        set({ tableCode: null });
      },

      clearCart() {
        set({ items: [], venueId: null, tableCode: null });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: "dryleaf-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      partialize: (s) => ({
        items: s.items,
        venueId: s.venueId,
        venueSlug: s.venueSlug,
        tableCode: s.tableCode,
      }),
    }
  )
);

// Селекторы
export const cartTotal = (items: CartItem[]) =>
  items.reduce((acc, i) => acc + i.priceCents * i.quantity, 0);
export const cartCount = (items: CartItem[]) =>
  items.reduce((acc, i) => acc + i.quantity, 0);
