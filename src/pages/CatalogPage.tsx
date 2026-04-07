import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import { getCommercialState } from "../lib/condition";
import Filters from "../components/Filters";
import DeviceCard from "../components/DeviceCard";
import type { ModeloGroup } from "../types";

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const catalog = useCatalogStore((s) => s.catalog);
  const filters = useCatalogStore((s) => s.filters);
  const loading = useCatalogStore((s) => s.loading);
  const setFilter = useCatalogStore((s) => s.setFilter);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const categoria = searchParams.get("categoria") ?? "";
    const condicion = searchParams.get("condicion") ?? "";
    setFilter("categoria", categoria);
    setFilter("condicion", condicion);
    setPage(1);
  }, [searchParams, setFilter]);

  const grouped = useMemo(() => {
    const filtered = catalog.filter((u) => {
      if (filters.categoria && u.modelo.categoria !== filters.categoria) return false;
      if (filters.modelo && u.modelo_id !== filters.modelo) return false;
      if (filters.color && u.color !== filters.color) return false;
      if (u.precio < filters.precioMin || u.precio > filters.precioMax) return false;
      if (filters.bateriaMin > 0 && u.bateria < filters.bateriaMin) return false;
      if (filters.condicion) {
        const state = getCommercialState(u.condicion, u.bateria);
        if (filters.condicion === "__nuevo__" && state !== "nuevo") return false;
        if (filters.condicion === "__usado__" && state !== "usado") return false;
        if (
          filters.condicion !== "__nuevo__" &&
          filters.condicion !== "__usado__" &&
          u.condicion !== filters.condicion
        )
          return false;
      }
      return true;
    });

    const map = new Map<string, ModeloGroup>();
    for (const u of filtered) {
      if (!map.has(u.modelo_id)) {
        map.set(u.modelo_id, { modelo: u.modelo, unidades: [] });
      }
      map.get(u.modelo_id)!.unidades.push(u);
    }
    return Array.from(map.values());
  }, [catalog, filters]);

  const totalPages = Math.ceil(grouped.length / PAGE_SIZE);
  const paginated = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <section className="surface-panel rounded-[2rem] border border-white/80 px-6 py-7 md:px-8 md:py-8 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-2">
              Catalogo activo
            </p>
            <h1 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)]">
              Tecnologia lista para cotizar
            </h1>
            <p className="text-[var(--muted)] mt-3 max-w-2xl">
              Filtra por categoria, estado o precio para responder consultas mas rapido y mostrar opciones concretas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="pill-muted text-[var(--text)]">
              {grouped.length} modelos
            </span>
            <span className="pill-muted text-[var(--text)]">
              Stock actualizado
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <Filters />

        <div className="flex-1">
          {loading ? (
            <div className="surface-card rounded-[1.75rem] text-center py-20 text-[var(--muted)]">
              Cargando...
            </div>
          ) : grouped.length === 0 ? (
            <div className="surface-card rounded-[1.75rem] text-center py-20 text-[var(--muted)]">
              No hay dispositivos con esos filtros.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                <p className="text-sm text-[var(--muted)] font-medium">
                  {grouped.length} modelos
                  {totalPages > 1 && ` · pagina ${page} de ${totalPages}`}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-bold">
                  Seleccion visible para venta inmediata
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map((group) => (
                  <DeviceCard key={group.modelo.modelo_id} group={group} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => goTo(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    ← Anterior
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1,
                      )
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                          acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === "…" ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 py-2 text-sm text-[var(--muted)]"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => goTo(p as number)}
                            className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                              page === p
                                ? "bg-[var(--primary)] text-white"
                                : "border border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                  </div>

                  <button
                    onClick={() => goTo(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
