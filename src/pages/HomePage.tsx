import { useMemo } from "react";
import { Link } from "react-router";
import { useCatalogStore } from "../store/catalogStore";
import DotGrid from "../components/DotGrid";

export default function HomePage() {
  const catalog = useCatalogStore((s) => s.catalog);
  const config = useCatalogStore((s) => s.config);
  const banners = config?.banners ?? [];
  const heroUnits = useMemo(
    () => catalog.filter((u) => u.imagen_url || u.modelo.imagen_principal).slice(0, 3),
    [catalog],
  );

  const categorias = useMemo(() => {
    const countMap = new Map<string, number>();
    catalog.forEach((u) => {
      countMap.set(
        u.modelo.categoria,
        (countMap.get(u.modelo.categoria) ?? 0) + 1,
      );
    });
    const lista = config?.categorias ?? [];
    return lista.map((categoria) => ({
      categoria,
      count: countMap.get(categoria) ?? 0,
    }));
  }, [catalog, config]);

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-8 pb-18 md:pt-12 md:pb-24 overflow-hidden">
        {/* DotGrid interactive background */}
        <div className="absolute inset-0 z-0 opacity-45">
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

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.2rem] md:rounded-[2.8rem] px-6 py-10 md:px-12 md:py-14 animate-rise border border-white/80 bg-gradient-to-b from-white/90 via-[#f8fbff]/86 to-[#edf4ff]/90 shadow-[0_40px_90px_-52px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-[var(--primary)]/12 blur-3xl" />
            <div className="absolute -bottom-24 left-[-20px] h-64 w-64 rounded-full bg-[#7dd3fc]/12 blur-3xl" />

            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {config?.hero_badge && (
                    <p className="pill-muted text-[11px] md:text-xs font-extrabold text-[var(--primary)] uppercase tracking-[0.22em]">
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                      {config.hero_badge}
                    </p>
                  )}
                  <span className="pill-muted text-xs font-semibold text-[var(--muted)]">
                    Equipos destacados y stock real
                  </span>
                </div>

                <h1 className="brand-heading text-5xl md:text-7xl font-bold text-[var(--text)] mb-5 leading-[0.94] max-w-3xl">
                  {config?.hero_titulo ?? "Tecnologia que entra por los ojos."}
                </h1>
                <p className="text-lg md:text-xl text-[var(--muted)] mb-8 max-w-2xl leading-relaxed">
                  {config?.hero_subtitulo ??
                    "Telefonos, notebooks y productos importados presentados con una estetica mas premium, clara y confiable para ayudar a vender mejor."}
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-base font-semibold px-8 py-3 rounded-full hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[#0a84ff4d]"
                  >
                    Explorar catalogo
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    to="/catalogo?condicion=__usado__"
                    className="inline-flex items-center gap-2 border border-[var(--line)] bg-white/80 text-[var(--text)] text-base font-semibold px-8 py-3 rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    Ver usados certificados
                  </Link>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="pill-muted text-sm text-[var(--text)]">
                    Presentacion mas premium
                  </span>
                  <span className="pill-muted text-sm text-[var(--text)]">
                    Imagenes protagonistas
                  </span>
                  <span className="pill-muted text-sm text-[var(--text)]">
                    Navegacion simple
                  </span>
                </div>
              </div>

              <div className="relative min-h-[420px] lg:min-h-[520px]">
                <div className="absolute inset-x-8 top-8 bottom-0 rounded-[2.4rem] bg-gradient-to-b from-[#f6fbff] to-[#dfeeff] shadow-[0_35px_80px_-50px_rgba(15,23,42,0.4)]" />

                {heroUnits[1] && (
                  <div className="absolute left-0 top-16 sm:left-8 lg:left-0 xl:left-6 w-40 sm:w-48 rounded-[1.8rem] bg-white/88 p-4 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur-md">
                    <img
                      src={heroUnits[1].imagen_url || heroUnits[1].modelo.imagen_principal}
                      alt={heroUnits[1].modelo.nombre}
                      className="h-32 sm:h-36 w-full object-contain drop-shadow-lg"
                    />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {heroUnits[1].modelo.categoria}
                    </p>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {heroUnits[1].modelo.nombre}
                    </p>
                  </div>
                )}

                {heroUnits[0] && (
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 w-[72%] max-w-[360px]">
                    <img
                      src={heroUnits[0].imagen_url || heroUnits[0].modelo.imagen_principal}
                      alt={heroUnits[0].modelo.nombre}
                      className="w-full object-contain drop-shadow-[0_42px_45px_rgba(15,23,42,0.25)]"
                    />
                  </div>
                )}

                {heroUnits[2] && (
                  <div className="absolute right-0 bottom-10 sm:right-8 lg:right-0 xl:right-6 w-40 sm:w-48 rounded-[1.8rem] bg-[#0f172a] text-white p-4 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.75)]">
                    <img
                      src={heroUnits[2].imagen_url || heroUnits[2].modelo.imagen_principal}
                      alt={heroUnits[2].modelo.nombre}
                      className="h-32 sm:h-36 w-full object-contain drop-shadow-lg"
                    />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/55">
                      seleccionado
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {heroUnits[2].modelo.nombre}
                    </p>
                  </div>
                )}

                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/86 px-5 py-3 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.45)] backdrop-blur-md">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {catalog.length} equipos publicados
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[var(--muted)]/50" />
                  <span className="text-sm text-[var(--muted)]">
                    {categorias.length} categorias activas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categorias.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="flex flex-col items-center mb-12 animate-rise text-center">
            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-3">
              Catálogo
            </span>
            <h2 className="brand-heading text-3xl md:text-5xl font-bold text-[var(--text)] text-center">
              Explora por categoria
            </h2>
            <p className="text-[var(--muted)] max-w-2xl mt-4">
              Accesos rapidos para entrar directo al tipo de producto que tu cliente ya esta buscando.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {categorias.map(({ categoria, count }, i) => (
              <Link
                key={categoria}
                to={`/catalogo?categoria=${categoria}`}
                className={`group relative overflow-hidden surface-panel hover:-translate-y-1 transition-all duration-300 rounded-[2rem] p-8 md:p-10 border border-white/80 flex flex-col justify-between h-64 md:h-72 animate-rise stagger-${Math.min(
                  i + 1,
                  3,
                )}`}
              >
                {/* Background Decoration */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[#4fc3ff] to-transparent opacity-80" />
                <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-[var(--primary)] opacity-[0.06] rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />

                <div className="relative z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/75 text-[11px] uppercase tracking-[0.1em] text-[var(--muted)] font-bold mb-4 border border-white">
                    {count} {count === 1 ? "equipo" : "equipos"}
                  </span>
                  <h3 className="brand-heading text-4xl md:text-5xl font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                    {categoria}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm md:text-base text-[var(--muted)] leading-relaxed">
                    Seleccion filtrada para comparar rapido, responder consultas y cerrar ventas con mas claridad.
                  </p>
                </div>

                <div className="relative z-10 flex items-center text-[var(--primary)] font-semibold group-hover:translate-x-2 transition-transform">
                  <span className="mr-2">Ver productos</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Banner Usados / Reacondicionados */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <Link
          to="/catalogo?condicion=__usado__"
          className="group relative flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0b1220] text-white rounded-[2rem] px-8 sm:px-12 py-10 overflow-hidden hover:brightness-110 transition-all duration-300 shadow-[0_32px_80px_-44px_rgba(11,18,32,0.95)]"
        >
          {/* glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a84ff22] via-transparent to-[#26d0ff18] pointer-events-none" />
          <div className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-[var(--primary)]/15 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-[#72b7ff] font-bold mb-2">
              Reacondicionados
            </span>
            <h2 className="brand-heading text-3xl sm:text-4xl font-bold leading-tight">
              Usados certificados
            </h2>
            <p className="text-zinc-400 mt-1 text-base sm:text-lg">
              Productos revisados, con estado verificado, fotos reales y garantia.
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
        <section className="max-w-[1440px] mx-auto px-3 pt-3 pb-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          {banners.map((banner, i) => (
            <div
              key={i}
              className="relative rounded-[2rem] aspect-square flex flex-col items-center justify-between pt-12 sm:pt-16 text-center overflow-hidden bg-gradient-to-br from-white via-[#eef5ff] to-[#dceafe] shadow-[0_26px_60px_-40px_rgba(10,132,255,0.45)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[#7ce2ff]" />
              <div className="relative z-10 px-6">
                <span className="inline-flex px-3 py-1 rounded-full bg-white/80 border border-white text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] font-bold mb-4">
                  Destacado
                </span>
                <h3 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] mb-1">
                  {banner.titulo}
                </h3>
                <p className="text-sm text-[#6e6e73] max-w-sm mx-auto">{banner.subtitulo}</p>
              </div>
              {banner.foto && (
                <img
                  src={banner.foto}
                  alt={banner.titulo}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] object-contain drop-shadow-[0_22px_35px_rgba(15,23,42,0.2)] pointer-events-none"
                />
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
