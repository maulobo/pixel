import { Routes, Route, useLocation } from "react-router";
import { useEffect } from "react";
import { useCatalogStore } from "./store/catalogStore";
import { fetchCatalog, fetchConfig, fetchCategorias } from "./lib/supabase";
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
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    console.log("[App] SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("[App] CLIENT_ID:", import.meta.env.VITE_CLIENT_ID);
    setLoading(true);
    Promise.all([fetchCatalog(), fetchConfig(), fetchCategorias()])
      .then(([catalog, config, categorias]) => {
        setCatalog(catalog);
        setConfig({ ...config, categorias });
        if (config.color_primario) {
          document.documentElement.style.setProperty("--primary", config.color_primario);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setCatalog, setConfig, setLoading, setError]);

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
