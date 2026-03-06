import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import type { Banner } from "../types";
import { fetchBanners } from "../lib/supabase";
import { useCatalogStore } from "../store/catalogStore";
import DotGrid from "../components/DotGrid";

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const catalog = useCatalogStore((s) => s.catalog);

  const categorias = useMemo(() => {
    const map = new Map<string, number>();
    catalog.forEach((u) => {
      map.set(u.modelo.tipo, (map.get(u.modelo.tipo) ?? 0) + 1);
    });
    return [...map.entries()].map(([tipo, count]) => ({ tipo, count }));
  }, [catalog]);

  useEffect(() => {
    fetchBanners()
      .then(setBanners)
      .catch((err) => console.error("Error cargando banners:", err));
  }, []);

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-20 md:py-28 px-6 text-center bg-white overflow-hidden">
        {/* DotGrid interactive background */}
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={6}
            gap={28}
            baseColor="#d1d5db"
            activeColor="#0a84ff"
            proximity={120}
            speedTrigger={80}
            shockRadius={220}
            shockStrength={4}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto animate-rise">
          <p className="text-xs md:text-sm font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-4">
            Importados
          </p>
          <h1 className="brand-heading text-5xl md:text-7xl font-bold text-[var(--text)] mb-6 leading-[1.02]">
            Tecnologia de primera,
            <br />
            <span className="text-[var(--muted)]">al mejor precio.</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] mb-10 max-w-2xl mx-auto">
            Celulares, audio, accesorios y mas. Todos importados, revisados y
            con garantia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/catalogo?condicion=__nuevo__"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-base font-semibold px-8 py-3 rounded-full hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[#0a84ff4d]"
            >
              Ver nuevos
              <span aria-hidden>→</span>
            </Link>
            <Link
              to="/catalogo?condicion=__usado__"
              className="inline-flex items-center gap-2 border-2 border-[var(--primary)] text-[var(--primary)] text-base font-semibold px-8 py-3 rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              Ver usados
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categorias.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20 md:pb-28 grid grid-cols-1 md:grid-cols-2 gap-6">
          {categorias.map(({ tipo, count }, i) => (
            <Link
              key={tipo}
              to={`/catalogo?tipo=${tipo}`}
              className={`group surface-card rounded-3xl p-8 md:p-10 flex flex-col gap-4 animate-rise hover:-translate-y-1 transition-all duration-300 stagger-${Math.min(i + 1, 3)}`}
            >
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--primary)] font-bold">
                {count} {count === 1 ? "producto" : "productos"}
              </span>
              <div>
                <h2 className="brand-heading text-3xl font-bold text-[var(--text)]">
                  {tipo}
                </h2>
              </div>
              <span className="text-[var(--primary)] text-sm font-semibold group-hover:underline">
                Ver {tipo} {"->"}
              </span>
            </Link>
          ))}
        </section>
      )}

      {/* Banner Usados / Reacondicionados */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <Link
          to="/catalogo?condicion=__usado__"
          className="group relative flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0f172a] text-white rounded-2xl px-8 sm:px-12 py-10 overflow-hidden hover:brightness-110 transition-all duration-300"
        >
          {/* glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a84ff22] via-transparent to-[#26d0ff18] pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-[#72b7ff] font-bold mb-2">
              Reacondicionados
            </span>
            <h2 className="brand-heading text-3xl sm:text-4xl font-bold leading-tight">
              Usados certificados
            </h2>
            <p className="text-zinc-400 mt-1 text-base sm:text-lg">
              Productos revisados, con estado verificado y garantia.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <span className="inline-flex items-center gap-2 bg-white text-black font-semibold px-7 py-3 rounded-full group-hover:bg-zinc-100 transition-colors">
              Explorar usados <span>→</span>
            </span>
          </div>
        </Link>
      </section>

      {/* Apple Bento Grid */}
      {banners.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-3 py-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {banners.map((banner) => (
            <div
              key={banner.name}
              className="relative rounded-2xl aspect-square flex flex-col items-center pt-14 sm:pt-20 text-center overflow-hidden bg-[#e3effa]"
            >
              {/* texto arriba */}
              <div className="relative z-10 px-6">
                <h3 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] mb-1">
                  {banner.name}
                </h3>
                <p className="text-lg sm:text-xl font-medium text-[#1d1d1f] tracking-tight mb-1">
                  {banner.description}
                </p>
                <p className="text-sm text-[#6e6e73]">
                  {banner.subdescription}
                </p>
              </div>

              {/* foto del producto centrada, cubre ~55% del ancho, pegada al fondo */}
              {banner.photo && (
                <img
                  src={banner.photo}
                  alt={banner.name}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] object-contain drop-shadow-xl pointer-events-none"
                />
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
