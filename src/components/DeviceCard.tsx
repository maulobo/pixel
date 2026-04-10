import { Link } from "react-router";
import type { ModeloGroup } from "../types";

interface Props {
  group: ModeloGroup;
}

export default function DeviceCard({ group }: Props) {
  const { modelo, unidades } = group;

  const uniqueColors = [...new Set(unidades.map((u) => u.atributos.color).filter(Boolean))];
  const uniqueCapacidades = [...new Set(unidades.map((u) => u.atributos.capacidad).filter(Boolean))];
  const minPrecio = modelo.precio;
  const hasVariants = uniqueColors.length > 1 || uniqueCapacidades.length > 1;

  return (
    <article className="group surface-panel rounded-[1.75rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col animate-rise border border-white/80">
      <Link to={`/catalogo/${modelo.modelo_id}`} className="flex flex-col flex-1">
        <div className="relative bg-gradient-to-br from-[#edf4ff] via-white to-[#dcecff] aspect-square flex items-center justify-center p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[#70d7ff] to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/80 border border-white font-semibold text-[var(--muted)] uppercase tracking-wide">
              {modelo.categoria}
            </span>
            {unidades.length > 1 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold uppercase tracking-wide">
                {unidades.length} unidades
              </span>
            )}
          </div>
          <img
            src={modelo.imagen_principal}
            alt={modelo.nombre}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/400x400/F5F5F7/6E6E73?text=Sin+imagen";
            }}
          />
        </div>

        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wide">
              {modelo.categoria}
            </p>
            <h3 className="text-base font-bold text-[var(--text)] leading-tight">
              {modelo.nombre}
            </h3>
          </div>

          {hasVariants && (
            <div className="flex flex-col gap-2">
              {uniqueColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueColors.map((color) => (
                    <span
                      key={color}
                      className="text-xs bg-[#edf2ff] text-[var(--text)] px-2 py-1 rounded-full"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              )}
              {uniqueCapacidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueCapacidades.map((cap) => (
                    <span
                      key={cap}
                      className="text-xs bg-[#f0fdf4] text-[#166534] px-2 py-1 rounded-full font-medium"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasVariants && unidades[0] && (
            <div className="flex flex-wrap gap-1.5 text-xs text-[var(--muted)]">
              {unidades[0].atributos.color && (
                <span className="bg-[#edf2ff] px-2 py-1 rounded-full">{unidades[0].atributos.color}</span>
              )}
              {unidades[0].atributos.capacidad && (
                <span className="bg-[#edf2ff] px-2 py-1 rounded-full">{unidades[0].atributos.capacidad}</span>
              )}
              {unidades[0].atributos.condicion && (
                <span className="bg-[#edf2ff] px-2 py-1 rounded-full">{unidades[0].atributos.condicion}</span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
            <div>
              {unidades.length > 1 && (
                <p className="text-xs text-[var(--muted)] font-medium mb-0.5">desde</p>
              )}
              <p className="text-xl font-extrabold text-[var(--text)]">
                ${minPrecio.toLocaleString("es-AR")}
              </p>
            </div>
            <span className="text-sm font-semibold text-[var(--primary)] group-hover:translate-x-1 transition-transform">
              Ver detalle →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
