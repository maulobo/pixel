import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import { buildCartWhatsAppUrl } from "../lib/whatsapp";
import type { UnidadConModelo } from "../types";

const EMPTY_VARIANTE_KEYS: string[] = [];

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1.2" />
      <circle cx="18" cy="21" r="1.2" />
      <path d="M2.5 3h2.2l2.4 11.3a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6.1" />
    </svg>
  );
}

export default function CartDrawer() {
  const catalog = useCatalogStore((s) => s.catalog);
  const cart = useCatalogStore((s) => s.cart);
  const isCartOpen = useCatalogStore((s) => s.isCartOpen);
  const whatsapp = useCatalogStore((s) => s.config?.whatsapp ?? "");
  const varianteKeys = useCatalogStore(
    (s) => s.config?.variante_keys ?? EMPTY_VARIANTE_KEYS,
  );
  const removeFromCart = useCatalogStore((s) => s.removeFromCart);
  const clearCart = useCatalogStore((s) => s.clearCart);
  const closeCart = useCatalogStore((s) => s.closeCart);
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);
  const [note, setNote] = useState("");
  const [shouldRender, setShouldRender] = useState(isCartOpen);
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    if (isCartOpen) {
      setShouldRender(true);
      const timeout = window.setTimeout(() => setIsVisible(true), 16);
      return () => window.clearTimeout(timeout);
    }
    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 260);
    return () => window.clearTimeout(timeout);
  }, [isCartOpen]);

  useEffect(() => {
    if (!shouldRender) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Cerrar carrito"
        className={`absolute inset-0 bg-[#07101f]/55 backdrop-blur-[2px] transition-opacity duration-250 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[440px] bg-[#f7fbff]/96 backdrop-blur-2xl border-l border-white/70 shadow-[-30px_0_70px_-45px_rgba(15,23,42,0.45)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[var(--line)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-1">
              Carrito
            </p>
            <h2 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
              <CartIcon />
              Tu seleccion
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-white/80 text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-white/80 border border-white flex items-center justify-center text-[var(--primary)] mb-5">
              <CartIcon />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text)]">
              Tu carrito esta vacio
            </h3>
            <p className="text-[var(--muted)] mt-3 max-w-sm">
              Agrega productos desde el catalogo o desde la ficha para armar una consulta por WhatsApp.
            </p>
            <Link
              to="/catalogo"
              onClick={closeCart}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-6 py-3 font-semibold hover:bg-[var(--primary-strong)] transition-colors"
            >
              Ir al catalogo
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {items.map((unidad) => (
                <article
                  key={unidad.unidad_id}
                  className="rounded-[1.5rem] border border-white/80 bg-white/78 p-4 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.4)]"
                >
                  <div className="flex gap-4">
                    <Link
                      to={`/catalogo/${unidad.modelo_id}`}
                      onClick={closeCart}
                      className="w-24 h-24 rounded-[1.25rem] bg-gradient-to-br from-[#edf4ff] via-white to-[#dcecff] flex items-center justify-center p-3 shrink-0"
                    >
                      <img
                        src={unidad.imagen_1 || unidad.modelo.imagen_principal}
                        alt={unidad.modelo.nombre}
                        className="w-full h-full object-contain"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-[var(--primary)] mb-1">
                        {unidad.modelo.categoria}
                      </p>
                      <Link
                        to={`/catalogo/${unidad.modelo_id}`}
                        onClick={closeCart}
                        className="block text-base font-bold text-[var(--text)] hover:text-[var(--primary)] transition-colors"
                      >
                        {unidad.modelo.nombre}
                      </Link>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        {varianteKeys.map((k) => unidad.atributos[k]).filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        Ref. {unidad.unidad_id}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-base font-extrabold text-[var(--text)]">
                          ${unidad.modelo.precio.toLocaleString("es-AR")}
                        </p>
                        <button
                          onClick={() => removeFromCart(unidad.unidad_id)}
                          className="text-sm font-semibold text-[#b42318] hover:text-[#912018] transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-[var(--line)] px-6 py-5 bg-white/55">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{items.length} productos</span>
                  <span className="font-semibold text-[var(--text)]">
                    ${subtotal.toLocaleString("es-AR")}
                  </span>
                </div>
                {tradeIn && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">
                        {tradeIn.modelo} {tradeIn.storage} · {tradeIn.condicion}
                      </span>
                      <button
                        onClick={clearTradeIn}
                        className="text-[#b42318] hover:text-[#912018] text-xs font-semibold transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                    <span className="font-semibold text-[#0a7a4a]">
                      −${tradeIn.valor.toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <span className="text-sm font-bold text-[var(--text)]">Total a pagar</span>
                  <span className="text-xl font-extrabold text-[var(--text)]">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Comentario opcional para el vendedor"
                className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              />

              <div className="grid gap-3 mt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[#25d366] px-5 py-4 text-white font-semibold hover:bg-[#1fb85a] transition-colors shadow-[0_22px_40px_-22px_rgba(37,211,102,0.8)]"
                >
                  Enviar por WhatsApp
                </a>
                <Link
                  to="/carrito"
                  onClick={closeCart}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--line)] bg-white/85 px-5 py-4 text-[var(--text)] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  Ver pagina del carrito
                </Link>
                <button
                  onClick={clearCart}
                  className="w-full inline-flex items-center justify-center rounded-[1.2rem] border border-[#fecaca] bg-[#fff1f2] px-5 py-4 text-[#b42318] font-semibold hover:bg-[#ffe4e8] transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
