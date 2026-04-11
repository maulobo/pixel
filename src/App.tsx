import { Routes, Route, useLocation } from "react-router";
import { useEffect } from "react";
import { useCatalogStore } from "./store/catalogStore";
import { fetchCatalog, fetchConfig, fetchCategorias, fetchTradeInData } from "./lib/supabase";
import { cacheGet, cacheSet } from "./lib/cache";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import DetailPage from "./pages/DetailPage";
import CartPage from "./pages/CartPage";
import AdminUploadPage from "./pages/AdminUploadPage";
import Loader from "./components/Loader";

export default function App() {
  const location = useLocation();
  const setCatalog = useCatalogStore((s) => s.setCatalog);
  const setConfig = useCatalogStore((s) => s.setConfig);
  const setLoading = useCatalogStore((s) => s.setLoading);
  const setError = useCatalogStore((s) => s.setError);
  const setTradeinData = useCatalogStore((s) => s.setTradeinData);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const CACHE_KEY = `pixel_data_${import.meta.env.VITE_CLIENT_ID}`;

    type AppData = {
      catalog: Awaited<ReturnType<typeof fetchCatalog>>;
      config: Awaited<ReturnType<typeof fetchConfig>>;
      categorias: Awaited<ReturnType<typeof fetchCategorias>>;
      tradeinData: Awaited<ReturnType<typeof fetchTradeInData>>;
    };

    const cached = cacheGet<AppData>(CACHE_KEY);
    if (cached) {
      setCatalog(cached.catalog);
      setConfig({ ...cached.config, categorias: cached.categorias });
      setTradeinData(cached.tradeinData);
      if (cached.config.color_primario) {
        document.documentElement.style.setProperty("--primary", cached.config.color_primario);
      }
      return;
    }

    setLoading(true);
    Promise.all([fetchCatalog(), fetchConfig(), fetchCategorias(), fetchTradeInData()])
      .then(([catalog, config, categorias, tradeinData]) => {
        setCatalog(catalog);
        setConfig({ ...config, categorias });
        setTradeinData(tradeinData);
        cacheSet(CACHE_KEY, { catalog, config, categorias, tradeinData });
        if (config.color_primario) {
          document.documentElement.style.setProperty("--primary", config.color_primario);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setCatalog, setConfig, setLoading, setError, setTradeinData]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen text-[var(--text)]">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/catalogo/:modeloId" element={<DetailPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/admin/upload" element={<AdminUploadPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
