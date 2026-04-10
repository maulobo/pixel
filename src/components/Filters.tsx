import { useCatalogStore } from "../store/catalogStore";
import { getCommercialState } from "../lib/condition";

export default function Filters() {
  const catalog = useCatalogStore((s) => s.catalog);
  const filters = useCatalogStore((s) => s.filters);
  const setFilter = useCatalogStore((s) => s.setFilter);
  const resetFilters = useCatalogStore((s) => s.resetFilters);

  const categorias = [...new Set(catalog.map((u) => u.modelo.categoria))].sort();
  const modelos = [...new Set(catalog.map((u) => u.modelo.nombre))].sort();
  const colores = [...new Set(catalog.map((u) => u.atributos.color).filter(Boolean))].sort();
  const condiciones = [...new Set(catalog.map((u) => u.atributos.condicion).filter(Boolean))].sort();

  const nuevosCount = catalog.filter(
    (u) => getCommercialState(u.atributos.condicion ?? "", u.atributos.bateria ?? 0) === "nuevo",
  ).length;
  const usadosCount = catalog.length - nuevosCount;

  const precios = catalog.map((u) => u.modelo.precio);
  const maxPrecio = precios.length ? Math.max(...precios) : 9999999;

  const hasBateria = catalog.some((u) => u.atributos.bateria);

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="surface-panel rounded-[1.75rem] p-5 flex flex-col gap-5 animate-rise stagger-1 border border-white/80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--primary)] mb-1">
              Navegacion rapida
            </p>
            <h2 className="font-semibold text-[var(--text)]">Filtros</h2>
          </div>
          <button
            onClick={resetFilters}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            Limpiar
          </button>
        </div>

        {/* Categoría */}
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            Categoría
          </p>
          <div className="flex gap-2 flex-wrap">
            {["", ...categorias].map((t) => (
              <button
                key={t}
                onClick={() => setFilter("categoria", t)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  filters.categoria === t
                    ? "bg-[var(--text)] text-white border-[var(--text)]"
                    : "bg-white/80 text-[var(--text)] border-[var(--line)] hover:border-[#8fa8dd]"
                }`}
              >
                {t || "Todos"}
              </button>
            ))}
          </div>
        </div>

        {/* Modelo */}
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            Modelo
          </p>
          <select
            value={filters.modelo}
            onChange={(e) => setFilter("modelo", e.target.value)}
            className="w-full text-sm bg-white/85 border border-[var(--line)] rounded-xl px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Todos</option>
            {modelos.map((m) => {
              const modeloId =
                catalog.find((u) => u.modelo.nombre === m)?.modelo_id ?? m;
              return (
                <option key={modeloId} value={modeloId}>
                  {m}
                </option>
              );
            })}
          </select>
        </div>

        {/* Color */}
        {colores.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Color
            </p>
            <select
              value={filters.color}
              onChange={(e) => setFilter("color", e.target.value)}
              className="w-full text-sm bg-white/85 border border-[var(--line)] rounded-xl px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Todos</option>
              {colores.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Estado Nuevo/Usado */}
        {condiciones.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Estado
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("condicion", "__nuevo__")}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.condicion === "__nuevo__"
                    ? "bg-[#0a84ff] text-white border-[#0a84ff]"
                    : "bg-white/85 text-[var(--text)] border-[var(--line)] hover:border-[#8fa8dd]"
                }`}
              >
                Nuevos ({nuevosCount})
              </button>
              <button
                onClick={() => setFilter("condicion", "__usado__")}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.condicion === "__usado__"
                    ? "bg-[#111827] text-white border-[#111827]"
                    : "bg-white/85 text-[var(--text)] border-[var(--line)] hover:border-[#8fa8dd]"
                }`}
              >
                Usados ({usadosCount})
              </button>
            </div>
          </div>
        )}

        {/* Condicion exacta */}
        {condiciones.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Condicion
            </p>
            <select
              value={filters.condicion.startsWith("__") ? "" : filters.condicion}
              onChange={(e) => setFilter("condicion", e.target.value)}
              className="w-full text-sm bg-white/85 border border-[var(--line)] rounded-xl px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Todas</option>
              {condiciones.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Batería */}
        {hasBateria && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Batería mínima:{" "}
              {filters.bateriaMin > 0 ? `${filters.bateriaMin}%` : "Todas"}
            </p>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.bateriaMin}
              onChange={(e) => setFilter("bateriaMin", Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        )}

        {/* Precio */}
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            Precio máx:{" "}
            {filters.precioMax === 99999999
              ? "Sin límite"
              : `$${filters.precioMax.toLocaleString("es-AR")}`}
          </p>
          <input
            type="range"
            min={0}
            max={maxPrecio}
            step={50000}
            value={
              filters.precioMax === 99999999 ? maxPrecio : filters.precioMax
            }
            onChange={(e) =>
              setFilter(
                "precioMax",
                Number(e.target.value) === maxPrecio
                  ? 99999999
                  : Number(e.target.value),
              )
            }
            className="w-full accent-[var(--primary)]"
          />
        </div>
      </div>
    </aside>
  );
}
