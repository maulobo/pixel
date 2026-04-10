import { useState } from "react";
import { useCatalogStore } from "../store/catalogStore";
import {
  IPHONE_MODELOS,
  STORAGE_OPTIONS,
  CONDICION_OPTIONS,
  cotizar,
} from "../lib/tradein";

export default function TradeInWidget() {
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const setTradeIn = useCatalogStore((s) => s.setTradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);

  const [modelo, setModelo] = useState("");
  const [storage, setStorage] = useState("");
  const [condicion, setCondicion] = useState("");

  const allSelected = modelo && storage && condicion;
  const valor = allSelected ? cotizar(modelo, storage, condicion) : 0;

  function handleAplicar() {
    if (!allSelected || valor === 0) return;
    setTradeIn({ modelo, storage, condicion, valor });
  }

  function handleCambiar() {
    clearTradeIn();
    setModelo("");
    setStorage("");
    setCondicion("");
  }

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 backdrop-blur-sm p-6 md:p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.14)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4 4 4" />
            <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Parte de pago
          </p>
          <h3 className="text-lg font-bold text-[var(--text)] leading-tight">
            Cotizá tu iPhone
          </h3>
        </div>
      </div>

      {tradeIn ? (
        <div className="space-y-4">
          <div className="rounded-[1.4rem] bg-[var(--primary)]/8 border border-[var(--primary)]/20 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">
                {tradeIn.modelo} · {tradeIn.storage} · {tradeIn.condicion}
              </p>
              <p className="text-2xl font-extrabold text-[var(--text)] tracking-[-0.03em]">
                −${tradeIn.valor.toLocaleString("es-AR")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f0e8] text-[#0a7a4a] text-xs font-bold px-3 py-1 uppercase tracking-[0.14em]">
              Aplicado
            </span>
          </div>
          <button
            onClick={handleCambiar}
            className="w-full rounded-[1.2rem] border border-[var(--line)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            Cambiar equipo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tradein-modelo" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Modelo
              </label>
              <select
                id="tradein-modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="rounded-[1rem] border border-[var(--line)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
              >
                <option value="">Seleccioná</option>
                {IPHONE_MODELOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="tradein-storage" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Almacenamiento
              </label>
              <select
                id="tradein-storage"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="rounded-[1rem] border border-[var(--line)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
              >
                <option value="">Seleccioná</option>
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="tradein-condicion" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Estado
              </label>
              <select
                id="tradein-condicion"
                value={condicion}
                onChange={(e) => setCondicion(e.target.value)}
                className="rounded-[1rem] border border-[var(--line)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
              >
                <option value="">Seleccioná</option>
                {CONDICION_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {allSelected && valor > 0 && (
            <div className="rounded-[1.4rem] bg-[#f0f7ff] border border-[var(--primary)]/20 px-5 py-4 flex items-center justify-between gap-4 animate-rise">
              <div>
                <p className="text-xs text-[var(--muted)] mb-0.5">Tu iPhone vale</p>
                <p className="text-2xl font-extrabold text-[var(--text)] tracking-[-0.03em]">
                  ${valor.toLocaleString("es-AR")}
                </p>
              </div>
              <button
                onClick={handleAplicar}
                className="shrink-0 rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--primary-strong)] transition-colors shadow-lg shadow-[#0a84ff33]"
              >
                Aplicar al carrito
              </button>
            </div>
          )}

          {allSelected && valor === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-2">
              Esta combinación no tiene cotización disponible.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
