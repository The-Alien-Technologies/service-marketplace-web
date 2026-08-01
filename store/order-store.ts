import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface OrderPlan {
  id: string;
  name: string;
  price: number;
}

export interface OrderService {
  id: string;
  title: string;
}

export interface PendingOrder {
  serviceId: string;
  service: OrderService;
  plan: OrderPlan;
  addOns: OrderAddOn[];
  addOnsTotal: number;
  subtotal: number;
  createdAt: number; // timestamp for cache invalidation
}

// Input type for creating an order (createdAt added automatically)
export type OrderInput = Omit<PendingOrder, "createdAt">;

interface OrderState {
  pendingOrder: PendingOrder | null;
  isLoading: boolean;
}

interface OrderStore extends OrderState {
  // Actions
  setPendingOrder: (order: OrderInput | null) => void;
  clearPendingOrder: () => void;
  setLoading: (loading: boolean) => void;

  // Computed getters
  hasPendingOrder: () => boolean;
  getTotal: (couponDiscount?: number) => number;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      pendingOrder: null,
      isLoading: false,

      // Actions
      setPendingOrder: (order) =>
        set({
          pendingOrder: order
            ? {
                ...order,
                createdAt: Date.now(), // Add timestamp
              }
            : null,
        }),

      clearPendingOrder: () =>
        set({
          pendingOrder: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      // Computed getters
      hasPendingOrder: () => {
        const { pendingOrder } = get();
        return pendingOrder !== null;
      },

      getTotal: (couponDiscount = 0) => {
        const { pendingOrder } = get();
        if (!pendingOrder) return 0;
        return pendingOrder.subtotal - couponDiscount;
      },
    }),
    {
      name: "order-storage",
      partialize: (state) => ({
        pendingOrder: state.pendingOrder,
      }),
    },
  ),
);
