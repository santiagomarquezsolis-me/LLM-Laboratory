import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EXPERIMENTS } from "./experiments/registry";

function useHashRoute(): [string, (id: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const go = (id: string) => {
    window.location.hash = id;
  };
  return [hash, go];
}

export default function App() {
  const [route, go] = useHashRoute();
  const active = EXPERIMENTS.find((e) => e.id === route) ?? null;

  return (
    <div className="mx-auto flex min-h-full max-w-[1280px] flex-col gap-8 px-5 py-8 lg:flex-row lg:gap-10 lg:py-12">
      <Sidebar activeId={active?.id ?? null} onGo={go} />
      <main className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.section
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <p className="eyebrow" style={{ color: active.color }}>
                {active.act}
              </p>
              <h1 className="mt-3 font-disp text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                {active.title}
              </h1>
              <p className="mb-8 mt-2 font-mono text-sm text-muted">
                {active.tagline}
              </p>
              <active.Component />
            </motion.section>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Home onGo={go} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Sidebar({
  activeId,
  onGo,
}: {
  activeId: string | null;
  onGo: (id: string) => void;
}) {
  return (
    <aside className="lg:w-72 lg:shrink-0">
      <button
        onClick={() => onGo("")}
        className="group flex items-center gap-3 text-left"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line2 font-mono text-signal shadow-glow">
          ƒ
        </span>
        <span>
          <span className="block font-disp text-base font-semibold text-text">
            El Laboratorio del LLM
          </span>
          <span className="block font-mono text-[11px] uppercase tracking-widest text-dim">
            demos interactivas
          </span>
        </span>
      </button>

      <nav className="mt-8 space-y-1.5">
        {EXPERIMENTS.map((e) => {
          const on = e.id === activeId;
          return (
            <button
              key={e.id}
              onClick={() => onGo(e.id)}
              className={
                "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition " +
                (on
                  ? "border-line2 bg-white/[0.05]"
                  : "border-transparent hover:border-line hover:bg-white/[0.03]")
              }
            >
              <span
                className="font-mono text-xs"
                style={{ color: e.color }}
              >
                {e.num}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-text">
                  {e.title}
                </span>
                <span className="block truncate font-mono text-[11px] text-dim">
                  {e.tagline}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <p className="mt-8 font-mono text-[11px] leading-relaxed text-dim">
        Todo corre en tu navegador con transformers.js. Sin servidores de IA, sin
        claves, sin enviar tus datos a ningún sitio.
      </p>
    </aside>
  );
}

function Home({ onGo }: { onGo: (id: string) => void }) {
  return (
    <div>
      <p className="eyebrow">IA · Incertidumbre · Confianza</p>
      <h1 className="mt-4 max-w-[16ch] font-disp text-4xl font-bold leading-[1.02] tracking-tight text-text sm:text-6xl">
        Toca cómo <span className="text-signal">piensa</span> (en realidad,{" "}
        <span className="text-halluc">calcula</span>) una IA
      </h1>
      <p className="mt-5 max-w-[60ch] text-lg text-muted">
        Cinco experimentos en vivo para entender qué ocurre dentro de un modelo
        de lenguaje: cómo trocea el texto, cómo predice el siguiente token, qué
        hace la temperatura, cómo convierte el significado en geometría y por qué
        a veces alucina. Modelos reales, ejecutándose en tu propio navegador.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {EXPERIMENTS.map((e) => (
          <button
            key={e.id}
            onClick={() => onGo(e.id)}
            className="card group p-6 text-left transition hover:-translate-y-1 hover:shadow-card"
            style={{ borderTop: `2px solid ${e.color}` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs" style={{ color: e.color }}>
                {e.num}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-dim">
                {e.act}
              </span>
            </div>
            <h3 className="mt-3 font-disp text-xl font-semibold text-text">
              {e.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{e.tagline}</p>
            <span className="mt-4 inline-block font-mono text-sm text-signal opacity-0 transition group-hover:opacity-100">
              Abrir →
            </span>
          </button>
        ))}
      </div>

      <p className="mt-10 font-mono text-xs text-dim">
        Acompaña la charla “Cuando una IA se equivoca con absoluta confianza”.
      </p>
    </div>
  );
}
