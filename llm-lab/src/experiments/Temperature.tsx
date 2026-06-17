import { useState } from "react";
import {
  nextTokenDistribution,
  sampleContinuation,
  DEFAULT_LM,
  type TokenProb,
} from "../lib/transformers";
import { useModelTask } from "../lib/useModelProgress";
import { LoadingBar } from "../components/LoadingBar";
import { ProbBars } from "../components/ProbBars";
import { ModelPicker } from "../components/ModelPicker";

const DEFAULT = "Once upon a time, the robot";

export function Temperature() {
  const [prompt, setPrompt] = useState(DEFAULT);
  const [temp, setTemp] = useState(0.8);
  const [tokens, setTokens] = useState<TokenProb[]>([]);
  const [sample, setSample] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_LM);
  const { state, run } = useModelTask();

  async function showDist() {
    const result = await run((cb) =>
      nextTokenDistribution(prompt, { temperature: temp, topK: 12, modelId }, cb)
    );
    if (result) setTokens(result);
  }

  async function generate() {
    setSample(prompt);
    await run((cb) =>
      sampleContinuation(
        prompt,
        { temperature: temp, maxTokens: 16, modelId },
        (_piece, full) => setSample(full),
        cb
      )
    );
  }

  const mood =
    temp < 0.4
      ? { label: "Determinista", color: "#54e0d6" }
      : temp < 1.1
      ? { label: "Equilibrado", color: "#7aa0ff" }
      : temp < 1.6
      ? { label: "Creativo", color: "#ffc24b" }
      : { label: "Caótico", color: "#ff5d8f" };

  return (
    <div className="space-y-6">
      <p className="text-muted">
        La <span className="text-warn">temperatura</span> reescala las
        probabilidades antes de muestrear. Baja → el modelo siempre elige lo más
        probable (predecible). Alta → aplana la distribución, se vuelve creativo…
        y propenso a inventar. Es la misma distribución, mirada con más o menos
        “osadía”.
      </p>

      <ModelPicker
        value={modelId}
        disabled={state.loading}
        onChange={(id) => {
          setModelId(id);
          setTokens([]);
          setSample("");
        }}
      />

      <div className="rounded-xl border border-line bg-black/30 p-4">
        <div className="mb-2 eyebrow">Contexto</div>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-transparent font-mono text-lg text-text outline-none"
        />
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-sm text-muted">
            Temperatura T ={" "}
            <span className="text-text">{temp.toFixed(2)}</span>
          </span>
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: mood.color }}
          >
            {mood.label}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={temp}
          onChange={(e) => setTemp(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="mt-1 flex justify-between font-mono text-[11px] text-dim">
          <span>0 · greedy</span>
          <span>1 · neutro</span>
          <span>2 · delirio</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="btn" onClick={showDist} disabled={state.loading}>
          Ver distribución a T={temp.toFixed(2)}
        </button>
        <button className="btn" onClick={generate} disabled={state.loading}>
          ✦ Generar continuación
        </button>
      </div>

      <LoadingBar state={state} />

      {sample && (
        <div className="card p-5">
          <div className="mb-2 eyebrow">Texto generado</div>
          <p className="font-mono text-base leading-relaxed text-text">
            {sample}
            {state.loading && <span className="animate-pulse text-signal">▋</span>}
          </p>
        </div>
      )}

      {tokens.length > 0 && (
        <div>
          <div className="mb-3 eyebrow">Distribución del siguiente token</div>
          <ProbBars tokens={tokens} />
        </div>
      )}

      <p className="font-mono text-xs text-dim">
        Sube la temperatura por encima de 1.5 y observa cómo el texto se
        desmorona. Prueba el modelo multilingüe (BLOOM) para generar en español.
      </p>
    </div>
  );
}
