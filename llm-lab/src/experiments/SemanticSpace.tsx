import { useMemo, useState } from "react";
import { embedMany, cosine } from "../lib/transformers";
import { pca2, type Point2D } from "../lib/pca";
import { useModelTask } from "../lib/useModelProgress";
import { LoadingBar } from "../components/LoadingBar";

type Cat = { name: string; color: string; words: string[] };

const CATEGORIES: Cat[] = [
  { name: "animales", color: "#7aa0ff", words: ["gato", "perro", "tigre", "león"] },
  { name: "realeza", color: "#ffc24b", words: ["rey", "reina", "trono", "corona"] },
  { name: "espacio", color: "#54e0d6", words: ["satélite", "órbita", "cohete", "planeta"] },
  { name: "emociones", color: "#bb9bff", words: ["alegría", "miedo", "tristeza", "calma"] },
  { name: "personas", color: "#ff8f6b", words: ["hombre", "mujer", "niño", "niña"] },
];

type WordVec = {
  word: string;
  color: string;
  vec: Float32Array;
  pt: Point2D;
};

const SIZE = 460;
const PAD = 46;

export function SemanticSpace() {
  const [data, setData] = useState<WordVec[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [extra, setExtra] = useState("");
  const [analogy, setAnalogy] = useState({ a: "rey", b: "reina", c: "hombre" });
  const [analogyResult, setAnalogyResult] = useState<string | null>(null);
  const { state, run } = useModelTask();

  const flatWords = useMemo(() => {
    const base = CATEGORIES.flatMap((c) =>
      c.words.map((w) => ({ word: w, color: c.color }))
    );
    const extras = extra
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((w) => ({ word: w, color: "#6dffb0" }));
    // analogy words that are not in the set (e.g. "hombre", "mujer")
    const analogyWords = [analogy.a, analogy.b, analogy.c]
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((w) => !base.some((b) => b.word === w) && !extras.some((e) => e.word === w))
      .map((w) => ({ word: w, color: "#90a2c0" }));
    const seen = new Set<string>();
    return [...base, ...extras, ...analogyWords].filter((x) => {
      if (seen.has(x.word)) return false;
      seen.add(x.word);
      return true;
    });
  }, [extra, analogy]);

  async function compute() {
    const vecs = await run((cb) =>
      embedMany(
        flatWords.map((w) => w.word),
        cb
      )
    );
    if (!vecs) return;
    const pts = pca2(vecs);
    setData(
      flatWords.map((w, i) => ({
        word: w.word,
        color: w.color,
        vec: vecs[i],
        pt: pts[i],
      }))
    );
    setSelected(null);
  }

  function neighborsOf(idx: number): { word: string; sim: number }[] {
    const base = data[idx];
    return data
      .map((d, i) => ({ word: d.word, sim: cosine(base.vec, d.vec), i }))
      .filter((x) => x.i !== idx)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);
  }

  function solveAnalogy() {
    const find = (w: string) => data.find((d) => d.word === w.trim());
    const A = find(analogy.a);
    const B = find(analogy.b);
    const C = find(analogy.c);
    if (!A || !B || !C) {
      setAnalogyResult("Pulsa “Calcular” primero (con esas palabras incluidas).");
      return;
    }
    const target = new Float32Array(A.vec.length);
    for (let i = 0; i < target.length; i++)
      target[i] = B.vec[i] - A.vec[i] + C.vec[i];
    let best = "";
    let bestSim = -Infinity;
    for (const d of data) {
      if ([analogy.a, analogy.b, analogy.c].includes(d.word)) continue;
      const s = cosine(target, d.vec);
      if (s > bestSim) {
        bestSim = s;
        best = d.word;
      }
    }
    setAnalogyResult(best);
  }

  const sel = selected != null ? data[selected] : null;
  const neighbors = selected != null ? neighborsOf(selected) : [];
  const neighborWords = new Set(neighbors.map((n) => n.word));

  return (
    <div className="space-y-6">
      <p className="text-muted">
        La IA convierte el lenguaje en{" "}
        <span className="text-signal">geometría</span>: cada palabra es un punto
        en un espacio de cientos de dimensiones. Lo parecido queda cerca. Aquí lo
        proyectamos a 2D (PCA) con embeddings reales. Pulsa una palabra para ver
        sus vecinos más próximos.
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="mb-1 font-mono text-xs text-muted">
            Añade tus palabras (separadas por comas)
          </div>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="p. ej. galaxia, perro, amor"
            className="w-full rounded-lg border border-line bg-black/30 px-3 py-2 font-mono text-sm text-text outline-none focus:border-signal"
          />
        </div>
        <button className="btn" onClick={compute} disabled={state.loading}>
          {state.loading ? "Calculando…" : "▶ Calcular embeddings"}
        </button>
      </div>

      <LoadingBar state={state} />

      <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
        <div className="card p-3">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%">
            <rect
              x={PAD - 16}
              y={PAD - 16}
              width={SIZE - 2 * (PAD - 16)}
              height={SIZE - 2 * (PAD - 16)}
              rx="14"
              fill="none"
              stroke="rgba(140,165,200,.12)"
            />
            {data.map((d, i) => {
              const x = PAD + d.pt.x * (SIZE - 2 * PAD);
              const y = SIZE - (PAD + d.pt.y * (SIZE - 2 * PAD));
              const isSel = i === selected;
              const isNeighbor = neighborWords.has(d.word);
              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onClick={() => setSelected(i)}
                >
                  {isSel && (
                    <circle cx={x} cy={y} r={12} fill="none" stroke={d.color} strokeOpacity={0.5} />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSel ? 6 : 4.5}
                    fill={d.color}
                    fillOpacity={isSel || isNeighbor ? 1 : 0.8}
                  />
                  <text
                    x={x + 8}
                    y={y + 4}
                    fontFamily="JetBrains Mono"
                    fontSize="12"
                    fill={isSel ? "#eaf2ff" : isNeighbor ? d.color : "#90a2c0"}
                  >
                    {d.word}
                  </text>
                </g>
              );
            })}
            {data.length === 0 && (
              <text
                x={SIZE / 2}
                y={SIZE / 2}
                textAnchor="middle"
                fontFamily="JetBrains Mono"
                fontSize="13"
                fill="#5d6f8c"
              >
                Pulsa “Calcular embeddings”
              </text>
            )}
          </svg>
          <p className="px-2 pb-1 font-mono text-[11px] text-dim">
            Proyección 2D (PCA) de vectores de 384 dimensiones · all-MiniLM-L6-v2
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c.name}
                className="chip"
                style={{ borderColor: c.color + "55", color: c.color }}
              >
                {c.name}
              </span>
            ))}
          </div>

          {sel && (
            <div className="card p-4">
              <div className="mb-2 eyebrow">Vecinos de “{sel.word}”</div>
              <ul className="space-y-1 font-mono text-sm">
                {neighbors.map((n) => (
                  <li key={n.word} className="flex justify-between">
                    <span className="text-text">{n.word}</span>
                    <span className="text-signal">{n.sim.toFixed(3)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-mono text-[11px] text-dim">
                Similitud coseno (1 = idénticos en significado).
              </p>
            </div>
          )}

          <div className="card p-4">
            <div className="mb-3 eyebrow">Analogía vectorial</div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <Field
                value={analogy.b}
                onChange={(v) => setAnalogy((a) => ({ ...a, b: v }))}
              />
              <span className="text-dim">−</span>
              <Field
                value={analogy.a}
                onChange={(v) => setAnalogy((a) => ({ ...a, a: v }))}
              />
              <span className="text-dim">+</span>
              <Field
                value={analogy.c}
                onChange={(v) => setAnalogy((a) => ({ ...a, c: v }))}
              />
              <span className="text-dim">≈</span>
              <span
                className="rounded px-2 py-1"
                style={{ background: "rgba(84,224,214,.12)", color: "#54e0d6" }}
              >
                {analogyResult ?? "?"}
              </span>
            </div>
            <button className="btn mt-3" onClick={solveAnalogy} disabled={!data.length}>
              Resolver
            </button>
            <p className="mt-2 font-mono text-[11px] text-dim">
              Clásico: reina − rey + hombre ≈ mujer. Las relaciones de significado
              son <em>direcciones</em> en el espacio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 rounded border border-line bg-black/30 px-2 py-1 text-center text-text outline-none focus:border-signal"
    />
  );
}
