import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import { buildCartWhatsAppUrl } from "../lib/whatsapp";
import type { UnidadConModelo } from "../types";

export default function CartPage() {
  const catalog = useCatalogStore((s) => s.catalog);
  const cart = useCatalogStore((s) => s.cart);
  const whatsapp = useCatalogStore((s) => s.config?.whatsapp ?? "");
  const varianteKeys = useCatalogStore((s) => s.config?.variante_keys ?? []);
  const removeFromCart = useCatalogStore((s) => s.removeFromCart);
  const clearCart = useCatalogStore((s) => s.clearCart);
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const [note, setNote] = useState("");

  const items = useMemo(
    () =>
      cart
        .map((id) => catalog.find((u) => u.unidad_id === id))
        .filter((item): item is UnidadConModelo => Boolean(item)),
    [cart, catalog],
  );
  const subtotal = items.reduce((sum, item) => sum + item.modelo.precio, 0);
  const total = Math.max(0, subtotal - (tradeIn?.valor ?? 0));
  const whatsappUrl =
    items.length > 0 && whatsapp ? buildCartWhatsAppUrl(items, whatsapp, note) : "#";

  if (items.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12 animate-rise">
        <section className="surface-panel rounded-[2rem] border border-white/80 px-8 py-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-3">
            Carrito
          </p>
          <h1 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)]">
            Todavia no agregaste productos
          </h1>
          <p className="text-[var(--muted)] max-w-xl mx-auto mt-4 mb-8">
            Cuando elijas varios equipos, vas a poder mandar todo junto por WhatsApp en un solo mensaje ordenado.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-7 py-3 font-semibold hover:bg-[var(--primary-strong)] transition-colors"
          >
            Ir al catalogo
            <span aria-hidden>→</span>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <section className="surface-panel rounded-[2rem] border border-white/80 px-6 py-7 md:px-8 md:py-8 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-2">
              Carrito
            </p>
            <h1 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)]">
              Consulta multiple por WhatsApp
            </h1>
            <p className="text-[var(--muted)] mt-3 max-w-2xl">
              Reuni varios productos, revisa el total estimado y manda una sola consulta prolija al vendedor.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="pill-muted text-[var(--text)]">
              {items.length} seleccionados
            </span>
            <span className="pill-muted text-[var(--text)]">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {items.map((unidad) => (
            <article
              key={unidad.unidad_id}
              className="surface-panel rounded-[1.75rem] border border-white/80 p-5 flex flex-col sm:flex-row gap-5"
            >
              <Link
                to={`/catalogo/${unidad.modelo_id}`}
                className="w-full sm:w-36 h-36 rounded-[1.5rem] bg-gradient-to-br from-[#edf4ff] via-white to-[#dcecff] flex items-center justify-center p-4"
              >
                <img
                  src={unidad.imagen_1 || unidad.modelo.imagen_principal}
                  alt={unidad.modelo.nombre}
                  className="w-full h-full object-contain"
                />
              </Link>

              <div className="flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] font-bold text-[var(--primary)] mb-1">
                      {unidad.modelo.categoria}
                    </p>
                    <Link
                      to={`/catalogo/${unidad.modelo_id}`}
                      className="text-xl font-bold text-[var(--text)] hover:text-[var(--primary)] transition-colors"
                    >
                      {unidad.modelo.nombre}
                    </Link>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {varianteKeys.map((k) => unidad.atributos[k]).filter(Boolean).join(" · ")} · Ref. {unidad.unidad_id}
                    </p>
                  </div>

                  <p className="text-xl font-extrabold text-[var(--text)]">
                    ${unidad.modelo.precio.toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <Link
                    to={`/catalogo/${unidad.modelo_id}`}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    Ver detalle
                  </Link>
                  <button
                    onClick={() => removeFromCart(unidad.unidad_id)}
                    className="inline-flex items-center justify-center rounded-full border border-[#fecaca] bg-[#fff1f2] px-4 py-2 text-sm font-semibold text-[#b42318] hover:bg-[#ffe4e8] transition-colors"
                  >
                    Quitar del carrito
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="surface-panel rounded-[1.75rem] border border-white/80 p-6 h-fit lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-2">
            Resumen
          </p>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-6">
            Listo para enviar
          </h2>

          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Productos</span>
              <span className="font-semibold text-[var(--text)]">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[var(--text)]">
                ${subtotal.toLocaleString("es-AR")}
              </span>
            </div>
            {tradeIn && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span>
                    {tradeIn.modelo} {tradeIn.storage} · {tradeIn.condicion}
                  </span>
                  <button
                    onClick={clearTradeIn}
                    className="text-left text-[#b42318] hover:text-[#912018] text-xs font-semibold transition-colors"
                  >
                    Quitar
                  </button>
                </div>
                <span className="font-semibold text-[#0a7a4a]">
                  −${tradeIn.valor.toLocaleString("es-AR")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 font-bold text-[var(--text)]">
              <span>Total a pagar</span>
              <span>${total.toLocaleString("es-AR")}</span>
            </div>
          </div>

          <label className="block mt-6">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              Comentario opcional
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              placeholder="Ej: Quiero saber disponibilidad, medios de pago o si me pueden armar combo."
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
          </label>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-[1.3rem] bg-[#25d366] px-5 py-4 text-white font-semibold hover:bg-[#1fb85a] transition-colors shadow-[0_22px_40px_-22px_rgba(37,211,102,0.8)]"
          >
            Enviar carrito por WhatsApp
          </a>

          <button
            onClick={clearCart}
            className="mt-3 w-full inline-flex items-center justify-center rounded-[1.3rem] border border-[var(--line)] bg-white/80 px-5 py-4 text-[var(--text)] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            Vaciar carrito
          </button>
        </aside>
      </div>
    </main>
  );
}
