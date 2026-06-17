import { useState } from "react";
import {
  nextTokenDistribution,
  DEFAULT_LM,
  type TokenProb,
} from "../lib/transformers";
import { useModelTask } from "../lib/useModelProgress";
import { LoadingBar } from "../components/LoadingBar";
import { ProbBars } from "../components/ProbBars";
import { ModelPicker } from "../components/ModelPicker";

const DEFAULT = "The cat sat on the";

export function NextToken() {
  const [prompt, setPrompt] = useState(DEFAULT);
  const [tokens, setTokens] = useState<TokenProb[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_LM);
  const { state, run } = useModelTask();

  async function predict(text: string) {
    const result = await run((cb) =>
      nextTokenDistribution(text, { temperature: 1, topK: 12, modelId }, cb)
    );
    if (result) setTokens(result);
  }

  function pick(t: TokenProb) {
    const next = prompt + t.token;
    setPrompt(next);
    void predict(next);
  }

  return (
    <div className="space-y-6">
      <p className="text-muted">
        Esta es la máquina entera, desnuda: dado un contexto, el modelo calcula{" "}
        <span className="font-mono text-signal">P(tokenₜ₊₁ | contexto)</span> — la
        probabilidad de cada posible siguiente token. No “sabe” la respuesta:
        reparte probabilidad. Pulsa un token para añadirlo y ver cómo recalcula.
      </p>

      <ModelPicker
        value={modelId}
        disabled={state.loading}
        onChange={(id) => {
          setModelId(id);
          setTokens([]);
        }}
      />

      <div className="rounded-xl border border-line bg-black/30 p-4">
        <div className="mb-2 eyebrow">Contexto</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="w-full resize-y bg-transparent font-mono text-lg text-text outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="btn"
          onClick={() => predict(prompt)}
          disabled={state.loading}
        >
          {state.loading ? "Calculando…" : "▶ Calcular probabilidades"}
        </button>
        <button
          className="btn"
          onClick={() => {
            setPrompt(DEFAULT);
            setTokens([]);
          }}
          disabled={state.loading}
        >
          Reiniciar
        </button>
      </div>

      <LoadingBar state={state} />

      {tokens.length > 0 && (
        <div>
          <div className="mb-3 eyebrow">
            Distribución del siguiente token (top 12)
          </div>
          <ProbBars tokens={tokens} onPick={state.loading ? undefined : pick} />
          <p className="mt-3 font-mono text-xs text-dim">
            Haz clic en cualquier barra para elegir ese token y continuar la
            frase. Cambia de modelo arriba para comparar cómo reparten la
            probabilidad.
          </p>
        </div>
      )}
    </div>
  );
}
