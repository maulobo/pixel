import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SiteConfig, UnidadConModelo } from "../types";

interface Filters {
  categoria: string;
  modelo: string;
  color: string;
  precioMin: number;
  precioMax: number;
  bateriaMin: number;
  condicion: string;
}

interface TradeIn {
  modelo: string;
  storage: string;
  condicion: string;
  valor: number;
}

interface CatalogStore {
  catalog: UnidadConModelo[];
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
  filters: Filters;
  cart: string[];
  isCartOpen: boolean;
  tradeIn: TradeIn | null;
  setTradeIn: (t: TradeIn) => void;
  clearTradeIn: () => void;
  setCatalog: (catalog: UnidadConModelo[]) => void;
  setConfig: (config: SiteConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  addToCart: (unidadId: string) => void;
  removeFromCart: (unidadId: string) => void;
  toggleCart: (unidadId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCartDrawer: () => void;
}

const DEFAULT_FILTERS: Filters = {
  categoria: "",
  modelo: "",
  color: "",
  precioMin: 0,
  precioMax: 99999999,
  bateriaMin: 0,
  condicion: "",
};

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set) => ({
      catalog: [],
      config: null,
      loading: false,
      error: null,
      filters: DEFAULT_FILTERS,
      cart: [],
      isCartOpen: false,
      tradeIn: null,

      setCatalog: (catalog) => set({ catalog }),
      setConfig: (config) => set({ config }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      addToCart: (unidadId) =>
        set((state) => ({
          cart: state.cart.includes(unidadId) ? state.cart : [...state.cart, unidadId],
        })),
      removeFromCart: (unidadId) =>
        set((state) => ({
          cart: state.cart.filter((id) => id !== unidadId),
        })),
      toggleCart: (unidadId) =>
        set((state) => ({
          cart: state.cart.includes(unidadId)
            ? state.cart.filter((id) => id !== unidadId)
            : [...state.cart, unidadId],
        })),
      clearCart: () => set({ cart: [] }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCartDrawer: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setTradeIn: (t) => set({ tradeIn: t }),
      clearTradeIn: () => set({ tradeIn: null }),
    }),
    {
      name: "pixel-cart",
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);
