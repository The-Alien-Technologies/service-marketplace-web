import { useEffect } from "react";
import { create } from "zustand";
import { apiService } from "@/lib/api";
import { Category } from "@/types/auth";

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface CategoriesStore extends CategoriesState {
  // Computed getters
  featuredCategories: () => Category[];
  topLevelCategories: () => Category[];

  // Actions
  fetchCategories: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
  getCategoryById: (id: string) => Category | undefined;
}

const CACHE_DURATION = 5 * 60 * 1000;// 5 minutes

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  // Initial state
  categories: [],
  isLoading: false,
  error: null,
  lastFetched: null,

// Computed getters
  featuredCategories: () => {
    return get().categories.filter((cat) => cat.featured);
  },

  topLevelCategories: () => {
    return get().categories.filter((cat) => !cat.parentCategoryId);
  },

  // Actions
  fetchCategories: async (force = false) => {
    const { lastFetched, isLoading } = get();

// Check cache validity
    if (
      !force &&
      lastFetched &&
      Date.now() - lastFetched < CACHE_DURATION
    ) {
      return;
    }
// Prevent duplicate fetches
    if (isLoading) return;

    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await apiService.getCategories();
      set({
        categories: response.categories ?? [],
        lastFetched: Date.now(),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch categories",
        isLoading: false,
      });
    }
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },

  getCategoryById: (id: string) => {
    return get().categories.find((cat) => cat.id === id);
  },
}));

// Hook to auto-fetch categories on first use
export function useCategories() {
  const store = useCategoriesStore();

  useEffect(() => {
    if (!store.lastFetched && !store.isLoading) {
      store.fetchCategories();
    }
    // The store handles caching; consumers only need to trigger the first fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    categories: store.categories,
    featuredCategories: store.featuredCategories(),
    topLevelCategories: store.topLevelCategories(),
    isLoading: store.isLoading,
    error: store.error,
    refetch: () => store.fetchCategories(true),
    invalidateCache: store.invalidateCache,
  };
}
