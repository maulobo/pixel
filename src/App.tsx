import { Routes, Route, useLocation } from "react-router";
import { useEffect } from "react";
import { useCatalogStore } from "./store/catalogStore";
import { fetchCatalog, fetchConfig, fetchCategorias, fetchTradeInData, fetchCacheVersion } from "./lib/supabase";
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
    const VERSION_KEY = `pixel_version_${import.meta.env.VITE_CLIENT_ID}`;

    type AppData = {
      catalog: Awaited<ReturnType<typeof fetchCatalog>>;
      config: Awaited<ReturnType<typeof fetchConfig>>;
      categorias: Awaited<ReturnType<typeof fetchCategorias>>;
      tradeinData: Awaited<ReturnType<typeof fetchTradeInData>>;
    };

    function applyData(data: AppData) {
      setCatalog(data.catalog);
      setConfig({ ...data.config, categorias: data.categorias });
      setTradeinData(data.tradeinData);
      if (data.config.color_primario) {
        document.documentElement.style.setProperty("--primary", data.config.color_primario);
      }
    }

    async function load() {
      // 1 request liviano: traer solo cache_version de config
      const remoteVersion = await fetchCacheVersion();
      const cachedVersion = localStorage.getItem(VERSION_KEY);
      const cached = cacheGet<AppData>(CACHE_KEY);

      if (cached && remoteVersion && cachedVersion === remoteVersion) {
        // cache válido y versión igual → carga instantánea
        applyData(cached);
        return;
      }

      // versión cambió o no hay cache → refetchear todo
      setLoading(true);
      try {
        const [catalog, config, categorias, tradeinData] = await Promise.all([
          fetchCatalog(), fetchConfig(), fetchCategorias(), fetchTradeInData(),
        ]);
        applyData({ catalog, config, categorias, tradeinData });
        cacheSet(CACHE_KEY, { catalog, config, categorias, tradeinData });
        if (remoteVersion) localStorage.setItem(VERSION_KEY, remoteVersion);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void load();
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
