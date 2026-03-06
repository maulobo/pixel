import { useCatalogStore } from "../store/catalogStore";
import { getCommercialState } from "../lib/condition";

export default function Filters() {
  const { catalog, filters, setFilter, resetFilters } = useCatalogStore();

  const tipos = [...new Set(catalog.map((u) => u.modelo.tipo))].sort();
  const modelos = [...new Set(catalog.map((u) => u.modelo.nombre))].sort();
  const colores = [...new Set(catalog.map((u) => u.color))].sort();
  const condiciones = [...new Set(catalog.map((u) => u.condicion))].sort();
  const nuevosCount = catalog.filter(
    (u) => getCommercialState(u.condicion, u.bateria) === "nuevo",
  ).length;
  const usadosCount = catalog.length - nuevosCount;
  const precios = catalog.map((u) => u.precio);
  const maxPrecio = precios.length ? Math.max(...precios) : 9999999;

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="surface-card rounded-2xl p-5 flex flex-col gap-5 animate-rise stagger-1">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text)]">Filtros</h2>
          <button
            onClick={resetFilters}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            Limpiar
          </button>
        </div>

        {/* Tipo */}
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            Tipo
          </p>
          <div className="flex gap-2 flex-wrap">
            {["", ...tipos].map((t) => (
              <button
                key={t}
                onClick={() => setFilter("tipo", t)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  filters.tipo === t
                    ? "bg-[var(--text)] text-white border-[var(--text)]"
                    : "bg-[#f7faff]/90 text-[var(--text)] border-[var(--line)] hover:border-[#8fa8dd]"
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
            className="w-full text-sm bg-[#f7faff] border border-[var(--line)] rounded-xl px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            Color
          </p>
          <select
            value={filters.color}
            onChange={(e) => setFilter("color", e.target.value)}
            className="w-full text-sm bg-[#f7faff] border border-[var(--line)] rounded-xl px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Todos</option>
            {colores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Condición */}
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
                  : "bg-[#f7faff] text-[var(--text)] border-[var(--line)] hover:border-[#8fa8dd]"
              }`}
            >
              Nuevos ({nuevosCount})
            </button>
            <button
              onClick={() => setFilter("condicion", "__usado__")}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filters.condicion === "__usado__"
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "bg-[#f7faff] text-[var(--text)] border-[var(--line)] hover:border-[#8fa8dd]"
              }`}
            >
              Usados ({usadosCount})
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            Condicion
          </p>
          <select
            value={filters.condicion.startsWith("__") ? "" : filters.condicion}
            onChange={(e) => setFilter("condicion", e.target.value)}
            className="w-full text-sm bg-[#f7faff] border border-[var(--line)] rounded-xl px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Todas</option>
            {condiciones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Batería */}
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
