import { create } from "zustand";
import type { UnidadConModelo } from "../types";
import { getCommercialState } from "../lib/condition";

interface Filters {
  tipo: string; // '' | 'iPhone' | 'Mac'
  modelo: string; // '' | modelo_id
  color: string; // '' | color name
  precioMin: number;
  precioMax: number;
  bateriaMin: number; // 0 = all
  condicion: string; // '' | condicion name
}

interface CatalogStore {
  catalog: UnidadConModelo[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  setCatalog: (catalog: UnidadConModelo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  filteredCatalog: () => UnidadConModelo[];
}

const DEFAULT_FILTERS: Filters = {
  tipo: "",
  modelo: "",
  color: "",
  precioMin: 0,
  precioMax: 99999999,
  bateriaMin: 0,
  condicion: "",
};

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  catalog: [],
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  setCatalog: (catalog) => set({ catalog }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  filteredCatalog: () => {
    const { catalog, filters } = get();
    return catalog.filter((u) => {
      if (filters.tipo && u.modelo.tipo !== filters.tipo) return false;
      if (filters.modelo && u.modelo_id !== filters.modelo) return false;
      if (filters.color && u.color !== filters.color) return false;
      if (u.precio < filters.precioMin || u.precio > filters.precioMax)
        return false;
      if (filters.bateriaMin > 0 && u.bateria < filters.bateriaMin)
        return false;
      if (filters.condicion) {
        if (
          filters.condicion === "__nuevo__" &&
          getCommercialState(u.condicion, u.bateria) !== "nuevo"
        ) {
          return false;
        }
        if (
          filters.condicion === "__usado__" &&
          getCommercialState(u.condicion, u.bateria) !== "usado"
        ) {
          return false;
        }
        if (
          filters.condicion !== "__nuevo__" &&
          filters.condicion !== "__usado__" &&
          u.condicion !== filters.condicion
        ) {
          return false;
        }
      }
      return true;
    });
  },
}));
