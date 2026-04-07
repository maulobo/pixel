import { Link, useLocation } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { useCatalogStore } from "../store/catalogStore";

const EMPTY: string[] = [];

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

export default function Navbar() {
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const activeCategoria = searchParams.get("categoria");
  const storeName = useCatalogStore((s) => s.config?.nombre_tienda ?? "Pixel");
  const categorias = useCatalogStore((s) => s.config?.categorias ?? EMPTY);
  const cartCount = useCatalogStore((s) => s.cart.length);
  const openCart = useCatalogStore((s) => s.openCart);
  const [menuOpen, setMenuOpen] = useState(false);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const linkClass = (active: boolean) =>
    `whitespace-nowrap transition-all duration-200 px-3 py-2 rounded-full ${
      active
        ? "text-white font-semibold opacity-100 bg-white/12 border border-white/10"
        : "text-white/68 border border-transparent"
    } hover:text-white hover:opacity-100 hover:bg-white/8`;

  return (
    <>
      <nav className="sticky top-0 z-50 px-3 pt-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 rounded-[1.4rem] bg-[var(--nav-bg)] text-white backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_48px_-38px_rgba(15,23,42,0.95)]">
          <div className="h-15 flex items-center justify-between text-xs sm:text-sm font-medium">

            {/* Logo */}
            <Link
              to="/"
              className="shrink-0 flex items-center gap-3"
            >
              <span className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold">
                P
              </span>
              <span className="flex flex-col leading-none">
                <span className="brand-heading text-base font-semibold text-white">
                  {storeName}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/48">
                  importados y tecnologia
                </span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex flex-1 items-center justify-center gap-2 overflow-x-auto no-scrollbar px-3">
              {categorias.map((cat) => (
                <Link
                  key={cat}
                  to={`/catalogo?categoria=${cat}`}
                  className={linkClass(activeCategoria === cat)}
                >
                  {cat}
                </Link>
              ))}
              <Link
                to="/catalogo"
                className={linkClass(!activeCategoria && location.pathname === "/catalogo")}
              >
                Todos
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={openCart}
                className="relative inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/8 text-white hover:bg-white/12 transition-colors"
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: Todos link + hamburger */}
            <div className="flex sm:hidden items-center gap-4">
              <button onClick={openCart} className="relative text-white/80">
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <Link
                to="/catalogo"
                className={linkClass(!activeCategoria && location.pathname === "/catalogo")}
              >
                Todos
              </Link>
              {categorias.length > 0 && (
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menú"
                  className="flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
                >
                  <span
                    className={`block h-[1.5px] bg-white transition-all duration-300 origin-center ${
                      menuOpen ? "w-5 rotate-45 translate-y-[6.5px]" : "w-5"
                    }`}
                  />
                  <span
                    className={`block h-[1.5px] bg-white transition-all duration-300 ${
                      menuOpen ? "w-0 opacity-0" : "w-3.5"
                    }`}
                  />
                  <span
                    className={`block h-[1.5px] bg-white transition-all duration-300 origin-center ${
                      menuOpen ? "w-5 -rotate-45 -translate-y-[6.5px]" : "w-5"
                    }`}
                  />
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-[#0b1220]/98 backdrop-blur-xl flex flex-col pt-16 px-6 pb-10"
          style={{ top: "72px" }}
        >
          <div className="flex flex-col gap-1 mt-4">
            {categorias.map((cat, i) => (
              <Link
                key={cat}
                to={`/catalogo?categoria=${cat}`}
                onClick={() => setMenuOpen(false)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`flex items-center justify-between py-4 border-b border-white/[0.07] text-lg font-medium animate-rise ${
                  activeCategoria === cat ? "text-white" : "text-white/70"
                }`}
              >
                {cat}
                {activeCategoria === cat && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                )}
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              style={{ animationDelay: `${categorias.length * 40}ms` }}
              className="flex items-center justify-between py-4 border-b border-white/[0.07] text-lg font-medium animate-rise text-white/70"
            >
              Carrito
              {cartCount > 0 && (
                <span className="min-w-6 h-6 px-1 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              to="/catalogo"
              onClick={() => setMenuOpen(false)}
              style={{ animationDelay: `${(categorias.length + 1) * 40}ms` }}
              className={`flex items-center justify-between py-4 text-lg font-medium animate-rise ${
                !activeCategoria && location.pathname === "/catalogo"
                  ? "text-white"
                  : "text-white/70"
              }`}
            >
              Ver todo
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
