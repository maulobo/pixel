import { useState } from "react";
import { useCatalogStore } from "../store/catalogStore";
import { getModelos, getAjusteOptions, cotizar } from "../lib/tradein";

function ExchangeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-[var(--primary)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 16V4m0 0L3 8m4-4 4 4" />
      <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-[var(--muted)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StepMarker({
  index,
  active,
  done,
}: {
  index: number;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
        done
          ? "bg-[var(--primary)] text-white"
          : active
            ? "border border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
            : "border border-[var(--line)] bg-white text-[var(--muted)]"
      }`}
    >
      {done ? <CheckIcon /> : index}
    </span>
  );
}

function StepCard({
  index,
  title,
  hint,
  active,
  done,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[1.5rem] border p-5 transition-all ${
        active
          ? "border-[var(--primary)]/25 bg-white shadow-[0_24px_50px_-38px_rgba(10,132,255,0.28)]"
          : done
            ? "border-white/80 bg-white/82"
            : "border-white/80 bg-white/58"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <StepMarker index={index} active={active} done={done} />
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  disabled,
  label,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[1rem] border px-4 py-3 text-sm font-semibold transition-all ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_16px_28px_-20px_rgba(10,132,255,0.8)]"
          : "border-[var(--line)] bg-[#f8fbff] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
      } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
    >
      {label}
    </button>
  );
}

export default function TradeInWidget() {
  const tradeIn = useCatalogStore((s) => s.tradeIn);
  const setTradeIn = useCatalogStore((s) => s.setTradeIn);
  const clearTradeIn = useCatalogStore((s) => s.clearTradeIn);
  const tradeinData = useCatalogStore((s) => s.tradeinData);

  const IPHONE_MODELOS = tradeinData ? getModelos(tradeinData) : [];
  const STORAGE_OPTIONS = tradeinData ? getAjusteOptions(tradeinData, "storage") : [];
  const CONDICION_OPTIONS = tradeinData ? getAjusteOptions(tradeinData, "condicion") : [];
  const BATERIA_OPTIONS = tradeinData ? getAjusteOptions(tradeinData, "bateria") : [];

  const [modelo, setModelo] = useState("");
  const [storage, setStorage] = useState("");
  const [condicion, setCondicion] = useState("");
  const [bateria, setBateria] = useState("");

  const hasModelo = Boolean(modelo);
  const hasStorage = Boolean(storage);
  const hasCondicion = Boolean(condicion);
  const hasBateria = Boolean(bateria);
  const allSelected = hasModelo && hasStorage && hasCondicion && hasBateria;
  const valor = allSelected && tradeinData ? cotizar(tradeinData, modelo, storage, condicion, bateria) : 0;

  function handleAplicar() {
    if (!allSelected || valor === 0) return;
    setTradeIn({ modelo, storage, condicion, bateria, valor });
  }

  function handleCambiar() {
    clearTradeIn();
    setModelo("");
    setStorage("");
    setCondicion("");
    setBateria("");
  }

  function handleModeloChange(nextModelo: string) {
    setModelo(nextModelo);
    setStorage("");
    setCondicion("");
    setBateria("");
  }

  function handleStorageChange(nextStorage: string) {
    setStorage(nextStorage);
    setCondicion("");
    setBateria("");
  }

  function handleCondicionChange(nextCondicion: string) {
    setCondicion(nextCondicion);
    setBateria("");
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-b from-white/90 via-[#f9fbff]/94 to-[#edf5ff]/92 p-6 shadow-[0_30px_75px_-48px_rgba(15,23,42,0.32)] backdrop-blur-xl md:p-8">
      <div className="absolute right-[-30px] top-[-20px] h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl" />
      <div className="absolute bottom-[-70px] left-[-10px] h-48 w-48 rounded-full bg-[#7dd3fc]/12 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
              <ExchangeIcon />
              Parte de pago
            </div>
            <h3 className="brand-heading text-2xl font-bold text-[var(--text)] md:text-3xl">
              Cotizá tu iPhone paso a paso
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-[15px]">
              Elegí el equipo que entrega el cliente, completá la capacidad y el estado, y aplicá el valor estimado directo al carrito.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <StepMarker index={1} active={!hasModelo} done={hasModelo} />
            <span className="h-px w-5 bg-[var(--line)]" />
            <StepMarker index={2} active={hasModelo && !hasStorage} done={hasStorage} />
            <span className="h-px w-5 bg-[var(--line)]" />
            <StepMarker
              index={3}
              active={hasModelo && hasStorage && !hasCondicion}
              done={hasCondicion}
            />
            <span className="h-px w-5 bg-[var(--line)]" />
            <StepMarker
              index={4}
              active={hasModelo && hasStorage && hasCondicion && !hasBateria}
              done={hasBateria}
            />
          </div>
        </div>

        {tradeIn ? (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.6rem] border border-[var(--primary)]/18 bg-[linear-gradient(135deg,rgba(10,132,255,0.10),rgba(255,255,255,0.92)_40%,rgba(125,211,252,0.12))] p-5 shadow-[0_24px_50px_-36px_rgba(10,132,255,0.35)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                Parte de pago aplicada
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-[var(--text)]">{tradeIn.modelo}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {tradeIn.storage} · {tradeIn.condicion} · Batería {tradeIn.bateria}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Valor tomado
                  </p>
                  <p className="text-3xl font-extrabold tracking-[-0.04em] text-[var(--text)]">
                    −${tradeIn.valor.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/80 bg-white/82 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Listo para usar
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Este valor ya queda disponible para descontarse del total del carrito.
              </p>
              <button
                onClick={handleCambiar}
                className="mt-5 inline-flex w-full items-center justify-center rounded-[1.1rem] border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Cambiar equipo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <StepCard
                index={1}
                title="Elegí el modelo"
                hint="Seleccioná qué iPhone entrega el cliente."
                active={!hasModelo}
                done={hasModelo}
              >
                <div className="relative">
                  <select
                    value={modelo}
                    onChange={(e) => handleModeloChange(e.target.value)}
                    className="w-full appearance-none rounded-[1rem] border border-[var(--line)] bg-[#f8fbff] px-4 py-3 pr-11 text-sm font-semibold text-[var(--text)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  >
                    <option value="">Seleccioná un modelo</option>
                    {IPHONE_MODELOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <ChevronIcon />
                  </span>
                </div>
              </StepCard>

              <StepCard
                index={2}
                title="Elegí la capacidad"
                hint="Una vez elegido el modelo, definí el almacenamiento."
                active={hasModelo && !hasStorage}
                done={hasStorage}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {STORAGE_OPTIONS.map((item) => (
                    <ChoiceButton
                      key={item}
                      label={item}
                      disabled={!hasModelo}
                      selected={storage === item}
                      onClick={() => handleStorageChange(item)}
                    />
                  ))}
                </div>
              </StepCard>

              <StepCard
                index={3}
                title="Indicá el estado"
                hint="Con eso calculamos el valor estimado de parte de pago."
                active={hasModelo && hasStorage && !hasCondicion}
                done={hasCondicion}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {CONDICION_OPTIONS.map((item) => (
                    <ChoiceButton
                      key={item}
                      label={item}
                      disabled={!hasStorage}
                      selected={condicion === item}
                      onClick={() => handleCondicionChange(item)}
                    />
                  ))}
                </div>
              </StepCard>

              <StepCard
                index={4}
                title="Estado de batería"
                hint="El porcentaje de salud de la batería ajusta el valor final."
                active={hasModelo && hasStorage && hasCondicion && !hasBateria}
                done={hasBateria}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {BATERIA_OPTIONS.map((item) => (
                    <ChoiceButton
                      key={item}
                      label={item}
                      disabled={!hasCondicion}
                      selected={bateria === item}
                      onClick={() => setBateria(item)}
                    />
                  ))}
                </div>
              </StepCard>
            </div>

            <aside className="rounded-[1.7rem] border border-[#dbeafe] bg-[linear-gradient(180deg,#fbfdff_0%,#edf6ff_100%)] p-5 shadow-[0_24px_50px_-40px_rgba(10,132,255,0.35)] lg:sticky lg:top-24">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                Resumen
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-[1.1rem] border border-white/85 bg-white/75 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Modelo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {modelo || "Pendiente"}
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-white/85 bg-white/75 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Capacidad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {storage || "Pendiente"}
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-white/85 bg-white/75 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Estado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {condicion || "Pendiente"}
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-white/85 bg-white/75 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Batería
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {bateria || "Pendiente"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-[var(--primary)]/16 bg-white/88 px-5 py-5">
                {!allSelected ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Valor estimado
                    </p>
                    <p className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[var(--text)]">
                      --
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Completá los pasos para ver cuánto se puede tomar este equipo.
                    </p>
                  </>
                ) : valor > 0 ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                      Valor estimado
                    </p>
                    <p className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[var(--text)]">
                      ${valor.toLocaleString("es-AR")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Este monto se descuenta del total cuando lo aplicás al carrito.
                    </p>
                    <button
                      onClick={handleAplicar}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-[1.1rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_22px_40px_-22px_rgba(10,132,255,0.55)] transition-colors hover:bg-[var(--primary-strong)]"
                    >
                      Aplicar al carrito
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Valor estimado
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--text)]">
                      No disponible
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Esta combinación todavía no tiene una cotización cargada.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
