import { useState, useEffect, useRef } from "react";
import { useCatalogStore } from "../store/catalogStore";
import { getModelos, getAjusteOptions, cotizar } from "../lib/tradein";

const STEPS = [
  { key: "modelo",    title: "¿Qué modelo es?",          hint: "Seleccioná el iPhone que entrega el cliente." },
  { key: "storage",   title: "¿Cuánto almacenamiento?",  hint: "Elegí la capacidad del equipo." },
  { key: "condicion", title: "¿En qué estado está?",     hint: "Evaluá el estado físico general." },
  { key: "bateria",   title: "¿Cómo está la batería?",   hint: "El porcentaje de salud ajusta el valor." },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

function ChipSelected({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="text-[var(--primary)]/60 hover:text-[var(--primary)] transition-colors leading-none"
        aria-label="Cambiar"
      >
        ✕
      </button>
    </span>
  );
}

function OptionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[1.1rem] border border-[var(--line)] bg-white px-5 py-3.5 text-left text-sm font-semibold text-[var(--text)] transition-all hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 hover:text-[var(--primary)] active:scale-[0.98]"
    >
      {label}
    </button>
  );
}

export default function TradeInWizard({ onApplied }: { onApplied?: () => void }) {
  const tradeinData = useCatalogStore((s) => s.tradeinData);
  const setTradeIn = useCatalogStore((s) => s.setTradeIn);

  const [modelo, setModelo] = useState("");
  const [storage, setStorage] = useState("");
  const [condicion, setCondicion] = useState("");
  const [bateria, setBateria] = useState("");

  // Which step is visible
  const currentStep = !modelo ? 0 : !storage ? 1 : !condicion ? 2 : !bateria ? 3 : 4;

  // Animate the step panel in when it changes
  const [visible, setVisible] = useState(true);
  const prevStep = useRef(currentStep);

  useEffect(() => {
    if (prevStep.current !== currentStep) {
      setVisible(false);
      const t = setTimeout(() => {
        setVisible(true);
        prevStep.current = currentStep;
      }, 180);
      return () => clearTimeout(t);
    }
  }, [currentStep]);

  if (!tradeinData) return null;

  const modelos = getModelos(tradeinData);
  const storageOpts = getAjusteOptions(tradeinData, "storage");
  const condicionOpts = getAjusteOptions(tradeinData, "condicion");
  const bateriaOpts = getAjusteOptions(tradeinData, "bateria");

  const allSelected = modelo && storage && condicion && bateria;
  const valor = allSelected ? cotizar(tradeinData, modelo, storage, condicion, bateria) : 0;

  function pick(key: StepKey, value: string) {
    if (key === "modelo") { setModelo(value); setStorage(""); setCondicion(""); setBateria(""); }
    if (key === "storage") { setStorage(value); setCondicion(""); setBateria(""); }
    if (key === "condicion") { setCondicion(value); setBateria(""); }
    if (key === "bateria") setBateria(value);
  }

  function clear(key: StepKey) {
    if (key === "modelo") { setModelo(""); setStorage(""); setCondicion(""); setBateria(""); }
    if (key === "storage") { setStorage(""); setCondicion(""); setBateria(""); }
    if (key === "condicion") { setCondicion(""); setBateria(""); }
    if (key === "bateria") setBateria("");
  }

  function handleAplicar() {
    if (!allSelected || valor === 0) return;
    setTradeIn({ modelo, storage, condicion, bateria, valor });
    onApplied?.();
  }

  const selections: { key: StepKey; value: string }[] = [
    { key: "modelo", value: modelo },
    { key: "storage", value: storage },
    { key: "condicion", value: condicion },
    { key: "bateria", value: bateria },
  ].filter((s) => s.value) as { key: StepKey; value: string }[];

  const optionsMap: Record<StepKey, string[]> = {
    modelo: modelos,
    storage: storageOpts,
    condicion: condicionOpts,
    bateria: bateriaOpts,
  };

  const isDone = currentStep === 4;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress bar */}
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < currentStep ? "bg-[var(--primary)]" : i === currentStep && !isDone ? "bg-[var(--primary)]/30" : "bg-[var(--line)]"
            }`}
          />
        ))}
      </div>

      {/* Selected chips */}
      {selections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selections.map(({ key, value }) => (
            <ChipSelected key={key} label={value} onClear={() => clear(key)} />
          ))}
        </div>
      )}

      {/* Current step or result */}
      <div
        className="transition-all duration-200"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
      >
        {!isDone ? (
          <div>
            <p className="text-xl font-bold text-[var(--text)] mb-1">
              {STEPS[currentStep].title}
            </p>
            <p className="text-sm text-[var(--muted)] mb-4">
              {STEPS[currentStep].hint}
            </p>

            {/* Modelo uses a select for long list */}
            {currentStep === 0 ? (
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && pick("modelo", e.target.value)}
                  className="w-full appearance-none rounded-[1.1rem] border border-[var(--line)] bg-white px-4 py-3.5 pr-10 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value="" disabled>Seleccioná un modelo</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            ) : (
              <div className="grid gap-2.5" style={{ gridTemplateColumns: currentStep >= 1 && optionsMap[STEPS[currentStep].key].length > 4 ? "1fr 1fr" : "1fr" }}>
                {optionsMap[STEPS[currentStep].key].map((opt) => (
                  <OptionButton key={opt} label={opt} onClick={() => pick(STEPS[currentStep].key, opt)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Result */
          <div>
            {valor > 0 ? (
              <div className="rounded-[1.5rem] border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/8 via-white/80 to-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-3">
                  Valor estimado de parte de pago
                </p>
                <p className="text-5xl font-extrabold tracking-[-0.04em] text-[var(--text)]">
                  ${valor.toLocaleString("es-AR")}
                </p>
                <p className="text-sm text-[var(--muted)] mt-2">
                  Este monto se descuenta del total cuando lo aplicás al carrito.
                </p>
                <button
                  onClick={handleAplicar}
                  className="mt-5 w-full rounded-[1.1rem] bg-[var(--primary)] py-3.5 text-sm font-bold text-white shadow-[0_20px_40px_-20px_rgba(10,132,255,0.55)] transition-colors hover:bg-[var(--primary-strong)]"
                >
                  Aplicar al carrito
                </button>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 text-center">
                <p className="font-bold text-[var(--text)]">Sin cotización disponible</p>
                <p className="text-sm text-[var(--muted)] mt-1">Esta combinación no tiene precio cargado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
