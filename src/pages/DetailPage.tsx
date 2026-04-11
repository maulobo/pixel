import { useParams, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCatalogStore } from "../store/catalogStore";
import { getCommercialState } from "../lib/condition";
import { getUnitPrice } from "../lib/pricing";
import { buildUnitWhatsAppUrl } from "../lib/whatsapp";
import type { UnidadConModelo } from "../types";
import TradeInWidget from "../components/TradeInWidget";

function TradeInModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-[#07101f]/60 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-[#f4f8ff]">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Parte de pago
          </p>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[var(--line)] bg-white/80 text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center text-base"
          >
            ✕
          </button>
        </div>
        <div className="px-4 pb-6">
          <TradeInWidget onApplied={onClose} />
        </div>
      </div>
    </div>
  );
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
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function GalleryArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Imagen anterior" : "Imagen siguiente"}
      className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/80 bg-white/88 p-3 text-[var(--text)] shadow-[0_18px_35px_-24px_rgba(15,23,42,0.45)] backdrop-blur transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] ${
        isPrev ? "left-4" : "right-4"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isPrev ? (
          <>
            <path d="m15 18-6-6 6-6" />
          </>
        ) : (
          <>
            <path d="m9 18 6-6-6-6" />
          </>
        )}
      </svg>
    </button>
  );
}

function prettifyAttributeLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function VariantPills({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-semibold mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
              selected === opt
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white/80 text-[var(--text)] border-[var(--line)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TradeInButton() {
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border-t border-[var(--line)] pt-5">
        {tradeIn ? (
          <div className="rounded-[1.4rem] border border-[var(--primary)]/20 bg-[var(--primary)]/6 px-4 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                Parte de pago aplicada
              </p>
              <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                {tradeIn.modelo} {tradeIn.storage}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {tradeIn.condicion} · Batería {tradeIn.bateria}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-extrabold text-[var(--text)]">
                −${tradeIn.valor.toLocaleString("es-AR")}
              </p>
              <button
                onClick={clearTradeIn}
                className="text-xs font-semibold text-[#b42318] hover:text-[#912018] transition-colors"
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-between gap-3 rounded-[1.2rem] border border-dashed border-[var(--primary)]/40 bg-[var(--primary)]/5 px-5 py-4 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/60 transition-all"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--text)]">¿Tenés un iPhone para dar en parte de pago?</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Cotizá tu equipo y aplicá el descuento al carrito</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white">
              Cotizar →
            </span>
          </button>
        )}
      </div>
      {open && createPortal(<TradeInModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

export default function DetailPage() {
  const { modeloId } = useParams();
  const catalog = useCatalogStore((s) => s.catalog);
  const config = useCatalogStore((s) => s.config);
  const whatsapp = useCatalogStore((s) => s.config?.whatsapp ?? "");
  const cart = useCatalogStore((s) => s.cart);
  const addToCart = useCatalogStore((s) => s.addToCart);
  const removeFromCart = useCatalogStore((s) => s.removeFromCart);
  const openCart = useCatalogStore((s) => s.openCart);

  const varianteKeys = config?.variante_keys ?? [];
  const varianteLabels = config?.variante_labels ?? {};

  const units = useMemo(
    () => catalog.filter((u) => u.modelo_id === modeloId),
    [catalog, modeloId],
  );

  const [selectedUnidad, setSelectedUnidad] = useState<UnidadConModelo | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedUnidad(units[0] ?? null);
  }, [modeloId, units]);

  const fallbackVarianteKeys = useMemo(() => {
    if (units.length <= 1) return [];

    const ignoredKeys = new Set([
      "descripcion",
      "descripcion_particular",
      "condicion",
      "bateria",
      "precio",
    ]);

    const allKeys = new Set<string>();
    units.forEach((unit) => {
      Object.keys(unit.atributos).forEach((key) => {
        if (!ignoredKeys.has(key)) allKeys.add(key);
      });
    });

    return Array.from(allKeys).filter((key) => {
      const values = new Set(
        units.map((unit) => unit.atributos[key]).filter(Boolean),
      );
      return values.size > 1;
    });
  }, [units]);

  const effectiveVarianteKeys =
    varianteKeys.length > 0 ? varianteKeys : fallbackVarianteKeys;

  const effectiveVarianteLabels = useMemo(() => {
    const labels: Record<string, string> = { ...varianteLabels };
    effectiveVarianteKeys.forEach((key) => {
      if (!labels[key]) labels[key] = prettifyAttributeLabel(key);
    });
    return labels;
  }, [effectiveVarianteKeys, varianteLabels]);

  // Unique values per variante key
  const uniqueValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const key of effectiveVarianteKeys) {
      result[key] = [...new Set(units.map((u) => u.atributos[key]).filter(Boolean))];
    }
    return result;
  }, [effectiveVarianteKeys, units]);

  function selectVariante(key: string, value: string) {
    const current = selectedUnidad?.atributos ?? {};
    // Try to find exact match with all current selections + new value
    const match = units.find((u) => {
      return effectiveVarianteKeys.every((k) => {
        if (k === key) return u.atributos[k] === value;
        return !current[k] || u.atributos[k] === current[k];
      });
    });
    if (match) { setSelectedUnidad(match); return; }
    // Fallback: just match the selected key
    const fallback = units.find((u) => u.atributos[key] === value);
    if (fallback) setSelectedUnidad(fallback);
  }

  const activeUnidad = selectedUnidad ?? units[0] ?? null;

  const images = useMemo(() => {
    if (!activeUnidad) return [];

    const candidates = [
      activeUnidad.imagen_1,
      activeUnidad.imagen_2,
      activeUnidad.imagen_3,
      activeUnidad.modelo.imagen_principal,
      activeUnidad.modelo.imagen_2,
      activeUnidad.modelo.imagen_3,
    ].filter((image): image is string => Boolean(image));

    return Array.from(new Set(candidates));
  }, [activeUnidad]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [activeUnidad?.unidad_id]);

  if (units.length === 0 || !activeUnidad) {
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

  const condicion = activeUnidad.atributos.condicion ?? "";
  const bateria = Number(activeUnidad.atributos.bateria ?? 0);
  const state = getCommercialState(condicion, bateria);
  const inCart = cart.includes(activeUnidad.unidad_id);
  const price = getUnitPrice(activeUnidad);

  const selectedImage =
    images[selectedImageIndex] ??
    activeUnidad.imagen_1 ??
    activeUnidad.modelo.imagen_principal;

  function showPreviousImage() {
    setSelectedImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNextImage() {
    setSelectedImageIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  function handleCartAction() {
    if (inCart) {
      removeFromCart(activeUnidad.unidad_id);
      return;
    }
    addToCart(activeUnidad.unidad_id);
    openCart();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <Link
        to="/catalogo"
        className="text-sm text-[var(--primary)] font-semibold hover:underline mb-8 inline-block"
      >
        {"<-"} Volver al catalogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="space-y-6">
          <div className="rounded-[2.2rem] border border-[var(--line)] bg-white/72 p-6 md:p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.18)]">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                {activeUnidad.modelo.categoria}
              </span>
              {condicion && (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                    state === "nuevo"
                      ? "bg-[#d9ecff] text-[#0066d6]"
                      : "bg-[#eef2f6] text-[#334155]"
                  }`}
                >
                  {state === "nuevo" ? "Nuevo" : "Usado"}
                </span>
              )}
              <span className="inline-flex rounded-full bg-white/80 border border-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Ref. {activeUnidad.unidad_id}
              </span>
              {units.length > 1 && (
                <span className="inline-flex rounded-full bg-white/80 border border-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {units.length} unidades
                </span>
              )}
            </div>

            <div className="relative rounded-[1.8rem] bg-gradient-to-b from-[#fbfdff] via-[#edf4ff] to-[#e2eeff] min-h-[360px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.18),transparent_36%)] pointer-events-none" />
              <div className="absolute -top-12 right-[-20px] h-40 w-40 rounded-full bg-[var(--primary)]/12 blur-3xl" />
              <div className="absolute -bottom-14 left-[-10px] h-44 w-44 rounded-full bg-[#7dd3fc]/18 blur-3xl" />
              {images.length > 1 && (
                <>
                  <GalleryArrow direction="prev" onClick={showPreviousImage} />
                  <GalleryArrow direction="next" onClick={showNextImage} />
                </>
              )}
              <img
                src={selectedImage}
                alt={activeUnidad.modelo.nombre}
                className="relative z-10 max-h-[420px] w-full object-contain px-8 drop-shadow-[0_40px_35px_rgba(15,23,42,0.18)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x600/F5F5F7/6E6E73?text=Sin+imagen";
                }}
              />
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`group relative h-20 w-20 overflow-hidden rounded-[1rem] border bg-white/80 transition-all ${
                      selectedImageIndex === index
                        ? "border-[var(--primary)] shadow-[0_18px_30px_-24px_rgba(10,132,255,0.8)]"
                        : "border-[var(--line)] hover:border-[var(--primary)]"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${activeUnidad.modelo.nombre} vista ${index + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/160x160/F5F5F7/6E6E73?text=Sin+imagen";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-1 md:px-2">
            <div className="flex flex-wrap gap-3 mb-5">
              {effectiveVarianteKeys.map((key) => {
                const val = activeUnidad.atributos[key];
                if (!val) return null;
                return (
                  <span key={key} className="pill-muted text-[var(--text)]">{val}</span>
                );
              })}
            </div>

            <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
              Sobre el {activeUnidad.modelo.nombre}
            </h2>
            <p className="text-[15px] text-[var(--muted)] leading-7">
              {activeUnidad.modelo.descripcion}
            </p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="pb-6 border-b border-[var(--line)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-3">
              Seleccion comercial
            </p>
            <h1 className="brand-heading text-4xl md:text-[3rem] font-bold text-[var(--text)] leading-[0.98]">
              {activeUnidad.modelo.nombre}
            </h1>
            <p className="text-lg text-[var(--muted)] mt-3">
              {effectiveVarianteKeys.map((k) => activeUnidad.atributos[k]).filter(Boolean).join(" · ")}
            </p>

            {effectiveVarianteKeys.some((k) => (uniqueValues[k]?.length ?? 0) > 1) && (
              <div className="mt-6 space-y-5">
                {effectiveVarianteKeys.map((key) => (
                  <VariantPills
                    key={key}
                    label={effectiveVarianteLabels[key] ?? key}
                    options={uniqueValues[key] ?? []}
                    selected={activeUnidad.atributos[key] ?? ""}
                    onSelect={(v) => selectVariante(key, v)}
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-semibold mb-1">
                  Precio publicado
                </p>
                <p className="text-5xl font-extrabold text-[var(--text)] tracking-[-0.04em]">
                  ${price.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="text-[#128c7e] px-1 py-1 text-sm font-semibold uppercase tracking-[0.16em]">
                WhatsApp directo
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-[0.16em]">
                Estado de esta unidad
              </h2>
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
                Lista para cotizar
              </span>
            </div>

            <div className="grid gap-1 border-t border-[var(--line)] pt-4">
              {condicion && (
                <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--line)]/70">
                  <p className="text-sm text-[var(--muted)]">Condicion</p>
                  <p className="text-sm font-semibold text-[var(--text)] text-right">{condicion}</p>
                </div>
              )}
              {activeUnidad.atributos.capacidad && (
                <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--line)]/70">
                  <p className="text-sm text-[var(--muted)]">Capacidad</p>
                  <p className="text-sm font-semibold text-[var(--text)] text-right">
                    {activeUnidad.atributos.capacidad}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--line)]/70">
                <p className="text-sm text-[var(--muted)]">Referencia</p>
                <p className="text-sm font-semibold text-[var(--text)] text-right">
                  {activeUnidad.unidad_id}
                </p>
              </div>
            </div>

            {bateria > 0 && (
              <div className="pt-1">
                <BatteryBar value={bateria} />
              </div>
            )}

            <div className="border-t border-[var(--line)] pt-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] font-semibold mb-2">
                Sugerencia
              </p>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Si el cliente esta comparando varios equipos, agrega este producto al carrito y envia una sola consulta completa por WhatsApp.
              </p>
            </div>

            <div className="grid gap-3 pt-6 border-t border-[var(--line)]">
              <a
                href={buildUnitWhatsAppUrl(activeUnidad, whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25d366] text-white text-center font-semibold py-4 rounded-[1.2rem] hover:bg-[#1fb85a] transition-colors flex items-center justify-center gap-2 text-lg shadow-[0_22px_40px_-22px_rgba(37,211,102,0.8)]"
              >
                <WhatsAppIcon />
                Consultar por WhatsApp
              </a>

              <button
                onClick={handleCartAction}
                className={`w-full text-center font-semibold py-4 rounded-[1.2rem] transition-colors text-lg ${
                  inCart
                    ? "bg-[#0f172a] text-white hover:bg-[#111c33]"
                    : "border border-[var(--line)] bg-white/85 text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                }`}
              >
                {inCart ? "Quitar del carrito" : "Agregar al carrito"}
              </button>
            </div>
          </div>

          <TradeInButton />
        </aside>
      </div>
    </main>
  );
}
