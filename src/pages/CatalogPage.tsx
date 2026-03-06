import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import Filters from "../components/Filters";
import DeviceCard from "../components/DeviceCard";

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const { filteredCatalog, setFilter, loading } = useCatalogStore();
  const [page, setPage] = useState(1);

  // Apply ?tipo= and ?condicion= from URL
  useEffect(() => {
    const tipo = searchParams.get("tipo") ?? "";
    const condicion = searchParams.get("condicion") ?? "";
    setFilter("tipo", tipo);
    setFilter("condicion", condicion);
    setPage(1);
  }, [searchParams, setFilter]);

  const results = filteredCatalog();
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <h1 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)] mb-8">
        Catalogo
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <Filters />

        <div className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-[var(--muted)]">
              Cargando...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted)]">
              No hay dispositivos con esos filtros.
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)] mb-5 font-medium">
                {results.length} productos
                {totalPages > 1 && ` · página ${page} de ${totalPages}`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map((u) => (
                  <DeviceCard key={u.unidad_id} unidad={u} />
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
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === "…" ? (
                          <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-[var(--muted)]">…</span>
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
                        )
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
