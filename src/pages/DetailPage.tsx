import { useParams, Link } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import type { UnidadConModelo } from "../types";
import { getCommercialState } from "../lib/condition";

const WHATSAPP_NUMBER = "5492990000000"; // placeholder — replace with real number

function buildWhatsAppUrl(unidad: UnidadConModelo) {
  const msg = encodeURIComponent(
    `Hola! Me interesa el ${unidad.modelo.nombre} ${unidad.capacidad} ${unidad.color} (ref: ${unidad.unidad_id}). ¿Está disponible?`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function BatteryBar({ value }: { value: number }) {
  if (value === 0) return null;
  const color =
    value >= 85 ? "bg-green-500" : value >= 70 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[var(--muted)]">Estado de bateria</span>
        <span className="font-semibold text-[var(--text)]">{value}%</span>
      </div>
      <div className="h-2 bg-[#dce7ff] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function DetailPage() {
  const { unidadId } = useParams();
  const catalog = useCatalogStore((s) => s.catalog);
  const unidad = catalog.find((u) => u.unidad_id === unidadId);

  if (!unidad) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[var(--muted)]">Dispositivo no encontrado.</p>
        <Link
          to="/catalogo"
          className="text-[var(--primary)] mt-4 inline-block hover:underline"
        >
          {"<-"} Volver al catalogo
        </Link>
      </div>
    );
  }

  const state = getCommercialState(unidad.condicion, unidad.bateria);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 animate-rise">
      <Link
        to="/catalogo"
        className="text-sm text-[var(--primary)] font-semibold hover:underline mb-8 inline-block"
      >
        {"<-"} Volver al catalogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="surface-card rounded-3xl aspect-square flex items-center justify-center p-10">
          <img
            src={unidad.imagen_url || unidad.modelo.imagen_principal}
            alt={`${unidad.modelo.nombre} ${unidad.color}`}
            className="h-full w-full object-contain drop-shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/600x600/F5F5F7/6E6E73?text=Sin+imagen";
            }}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-widest mb-1">
              {unidad.modelo.tipo}
            </p>
            <span
              className={`inline-flex text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide mb-3 ${
                state === "nuevo"
                  ? "bg-[#d9ecff] text-[#0066d6]"
                  : "bg-[#e5e7eb] text-[#1f2937]"
              }`}
            >
              {state === "nuevo" ? "Nuevo" : "Usado"}
            </span>
            <h1 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)] leading-tight">
              {unidad.modelo.nombre}
            </h1>
            <p className="text-xl text-[var(--muted)] mt-1">
              {unidad.capacidad} · {unidad.color}
            </p>
          </div>

          <p className="text-3xl font-extrabold text-[var(--text)]">
            ${unidad.precio.toLocaleString("es-AR")}
          </p>

          {/* Unit specific */}
          <div className="surface-card rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">
              Estado de esta unidad
            </h2>
            <BatteryBar value={unidad.bateria} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Condicion</span>
              <span className="font-semibold text-[var(--text)]">
                {unidad.condicion}
              </span>
            </div>
            {unidad.descripcion_particular && (
              <div>
                <p className="text-xs text-[var(--muted)] mb-1">Notas</p>
                <p className="text-sm text-[var(--text)]">
                  {unidad.descripcion_particular}
                </p>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <a
            href={buildWhatsAppUrl(unidad)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[var(--primary)] text-white text-center font-semibold py-4 rounded-2xl hover:bg-[var(--primary-strong)] transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Consultar por WhatsApp
          </a>

          {/* Model general info */}
          <div className="border-t border-[var(--line)] pt-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
              Sobre el {unidad.modelo.nombre}
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              {unidad.modelo.descripcion_general}
            </p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {unidad.modelo.specs}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
