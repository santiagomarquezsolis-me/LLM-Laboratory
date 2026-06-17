import type { LoadState } from "../lib/useModelProgress";

export function LoadingBar({ state }: { state: LoadState }) {
  if (state.error) {
    return (
      <div className="rounded-lg border border-halluc/40 bg-halluc/5 px-4 py-3 font-mono text-sm text-halluc">
        Error: {state.error}
      </div>
    );
  }
  if (!state.loading) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>{state.label || "Cargando modelo…"}</span>
        <span>{Math.round(state.progress * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-signal to-azure transition-[width] duration-300"
          style={{ width: `${Math.max(4, state.progress * 100)}%` }}
        />
      </div>
      <p className="font-mono text-[11px] text-dim">
        La primera vez se descarga el modelo (se queda en caché del navegador).
        Todo el cálculo ocurre en tu dispositivo.
      </p>
    </div>
  );
}
