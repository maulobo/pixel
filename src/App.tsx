import { Routes, Route } from "react-router";
import { useEffect } from "react";
import { useCatalogStore } from "./store/catalogStore";
import { fetchCatalog } from "./lib/supabase";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import DetailPage from "./pages/DetailPage";

export default function App() {
  const { setCatalog, setLoading, setError } = useCatalogStore();

  useEffect(() => {
    setLoading(true);
    fetchCatalog()
      .then(setCatalog)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setCatalog, setLoading, setError]);

  return (
    <div className="min-h-screen text-[var(--text)]">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/catalogo/:unidadId" element={<DetailPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
