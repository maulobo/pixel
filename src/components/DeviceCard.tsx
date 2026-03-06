import { Link } from "react-router";
import type { UnidadConModelo } from "../types";
import { getCommercialState } from "../lib/condition";

interface Props {
  unidad: UnidadConModelo;
}

function BatteryBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const color =
    value >= 85
      ? "text-green-700 bg-green-100"
      : value >= 70
        ? "text-yellow-700 bg-yellow-100"
        : "text-red-600 bg-red-100";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      🔋 {value}%
    </span>
  );
}

export default function DeviceCard({ unidad }: Props) {
  const state = getCommercialState(unidad.condicion, unidad.bateria);

  return (
    <Link
      to={`/catalogo/${unidad.unidad_id}`}
      className="group surface-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col animate-rise"
    >
      {/* Image */}
      <div className="bg-[#e8efff] aspect-square flex items-center justify-center p-8">
        <img
          src={unidad.imagen_url || unidad.modelo.imagen_principal}
          alt={`${unidad.modelo.nombre} ${unidad.color}`}
          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x400/F5F5F7/6E6E73?text=Sin+imagen";
          }}
        />
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
              state === "nuevo"
                ? "bg-[#d9ecff] text-[#0066d6]"
                : "bg-[#e5e7eb] text-[#1f2937]"
            }`}
          >
            {state === "nuevo" ? "Nuevo" : "Usado"}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wide">
              {unidad.modelo.tipo}
            </p>
            <h3 className="text-base font-bold text-[var(--text)] leading-tight">
              {unidad.modelo.nombre}
            </h3>
          </div>
          <BatteryBadge value={unidad.bateria} />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-[var(--muted)]">
          <span className="bg-[#edf2ff] px-2 py-0.5 rounded-full">
            {unidad.color}
          </span>
          {unidad.capacidad && (
            <span className="bg-[#edf2ff] px-2 py-0.5 rounded-full">
              {unidad.capacidad}
            </span>
          )}
          <span className="bg-[#edf2ff] px-2 py-0.5 rounded-full">
            {unidad.condicion}
          </span>
        </div>

        <p className="mt-auto pt-3 text-xl font-extrabold text-[var(--text)]">
          ${unidad.precio.toLocaleString("es-AR")}
        </p>
      </div>
    </Link>
  );
}
