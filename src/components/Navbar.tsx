import { Link, useLocation } from "react-router";
import { useMemo } from "react";
import { useCatalogStore } from "../store/catalogStore";

export default function Navbar() {
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const activeTipo = searchParams.get("tipo");

  const catalog = useCatalogStore((s) => s.catalog);
  const tipos = useMemo(
    () => [...new Set(catalog.map((u) => u.modelo.tipo))].sort(),
    [catalog],
  );

  const isActive = (tipo: string) => activeTipo === tipo;

  return (
    <nav className="sticky top-0 z-50 bg-[#161617]/95 text-white backdrop-blur-md border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-12 flex items-center justify-between text-xs sm:text-sm font-medium">
          <Link
            to="/"
            className="brand-heading text-lg font-semibold text-white hover:text-white transition-colors"
          >
            Pixel
          </Link>

          <div className="flex flex-1 items-center justify-end sm:justify-center gap-5 sm:gap-8 overflow-x-auto no-scrollbar">
            {tipos.map((tipo) => (
              <Link
                key={tipo}
                to={`/catalogo?tipo=${tipo}`}
                className={`whitespace-nowrap ${isActive(tipo) ? "text-white font-bold opacity-100" : "text-[#e5e5e5] opacity-80"} hover:opacity-100 hover:text-white transition-all`}
              >
                {tipo}
              </Link>
            ))}
            <Link
              to="/catalogo"
              className={`whitespace-nowrap ${!activeTipo && location.pathname === "/catalogo" ? "text-white font-bold opacity-100" : "text-[#e5e5e5] opacity-80"} hover:opacity-100 hover:text-white transition-all`}
            >
              Catálogo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
