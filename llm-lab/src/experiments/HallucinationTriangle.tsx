import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Outcome = {
  ok: number;
  abstain: number;
  halluc: number;
  ignorance: number;
};

function clamp(x: number) {
  return Math.max(0, Math.min(100, x));
}

// Mismo modelo conceptual que el simulador de la charla:
// la ignorancia depende de cuánto sabe el modelo y de cuántas fuentes tiene.
// La presión por responder convierte esa ignorancia en invención (alucinación)
// en lugar de en un honesto "no lo sé".
function compute(k: number, p: number, f: number): Outcome {
  const ignorance = clamp(100 - 0.6 * k - 0.4 * f);
  let halluc = Math.round(ignorance * (p / 100) * 0.9);
  let abstain = Math.round(ignorance * (1 - p / 100));
  let ok = clamp(100 - halluc - abstain);
  const tot = ok + abstain + halluc || 1;
  ok = Math.round((ok / tot) * 100);
  abstain = Math.round((abstain / tot) * 100);
  halluc = 100 - ok - abstain;
  return { ok, abstain, halluc, ignorance };
}

const COLORS = {
  ok: [109, 255, 176] as const, // green
  abstain: [122, 160, 255] as const, // azure
  halluc: [255, 93, 143] as const, // halluc
};

function rgb(c: readonly [number, number, number], a = 1) {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

// Vértices del triángulo en el espacio del SVG (320 x 300).
const V = {
  halluc: { x: 160, y: 34 }, // arriba
  ok: { x: 38, y: 250 }, // abajo-izquierda
  abstain: { x: 282, y: 250 }, // abajo-derecha
};

type Preset = {
  label: string;
  hint: string;
  k: number;
  p: number;
  f: number;
};

const PRESETS: Preset[] = [
  {
    label: "Pregunta difícil, con prisa",
    hint: "Poco conocimiento, sin fuentes, mucha presión → inventa.",
    k: 25,
    p: 85,
    f: 10,
  },
  {
    label: "Con RAG y sin presión",
    hint: "Fuentes a mano y libertad para abstenerse → honesto.",
    k: 45,
    p: 20,
    f: 85,
  },
  {
    label: "Dominio que conoce bien",
    hint: "Mucho conocimiento → acierta aunque le metan prisa.",
    k: 90,
    p: 80,
    f: 40,
  },
  {
    label: "El peor caso",
    hint: "No sabe, no tiene fuentes y le exigen responder ya.",
    k: 5,
    p: 100,
    f: 0,
  },
];

export function HallucinationTriangle() {
  const [k, setK] = useState(55);
  const [p, setP] = useState(70);
  const [f, setF] = useState(25);

  const out = useMemo(() => compute(k, p, f), [k, p, f]);

  // Posición del punto = combinación baricéntrica de los tres resultados.
  const point = useMemo(() => {
    const w = { ok: out.ok / 100, abstain: out.abstain / 100, halluc: out.halluc / 100 };
    return {
      x: V.ok.x * w.ok + V.abstain.x * w.abstain + V.halluc.x * w.halluc,
      y: V.ok.y * w.ok + V.abstain.y * w.abstain + V.halluc.y * w.halluc,
    };
  }, [out]);

  // Color del punto = mezcla de los tres colores según los pesos.
  const pointColor = useMemo(() => {
    const w = [out.ok / 100, out.abstain / 100, out.halluc / 100];
    const cs = [COLORS.ok, COLORS.abstain, COLORS.halluc];
    const mix = [0, 1, 2].map((i) =>
      Math.round(cs[0][i] * w[0] + cs[1][i] * w[1] + cs[2][i] * w[2])
    ) as [number, number, number];
    return rgb(mix);
  }, [out]);

  const dominant =
    out.halluc >= out.ok && out.halluc >= out.abstain
      ? { label: "Riesgo de alucinación", color: rgb(COLORS.halluc) }
      : out.abstain >= out.ok
      ? { label: "Tiende a reconocer «no sé»", color: rgb(COLORS.abstain) }
      : { label: "Tiende a acertar", color: rgb(COLORS.ok) };

  return (
    <div className="space-y-6">
      <p className="text-muted">
        Una alucinación no nace solo de la <span className="text-warn">ignorancia</span>{" "}
        del modelo, sino de la combinación de tres fuerzas. Cuando falta{" "}
        <span className="text-green">conocimiento</span> y faltan{" "}
        <span className="text-azure">fuentes</span>, pero sobra{" "}
        <span className="text-halluc">presión por responder</span>, esa ignorancia
        se transforma en invención segura de sí misma. Mueve los controles y
        observa cómo se desplaza el punto dentro del triángulo.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controles */}
        <div className="space-y-5">
          <Slider
            label="Conocimiento del sistema"
            value={k}
            onChange={setK}
            color={rgb(COLORS.ok)}
          />
          <Slider
            label="Presión por responder"
            value={p}
            onChange={setP}
            color={rgb(COLORS.halluc)}
          />
          <Slider
            label="Acceso a fuentes (RAG)"
            value={f}
            onChange={setF}
            color={rgb(COLORS.abstain)}
          />

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                className="btn"
                title={preset.hint}
                onClick={() => {
                  setK(preset.k);
                  setP(preset.p);
                  setF(preset.f);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Triángulo */}
        <div className="card flex flex-col items-center justify-center p-5">
          <svg viewBox="0 0 320 300" className="w-full max-w-[360px]">
            <defs>
              <radialGradient id="tri-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={pointColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={pointColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Lados del triángulo */}
            <polygon
              points={`${V.halluc.x},${V.halluc.y} ${V.ok.x},${V.ok.y} ${V.abstain.x},${V.abstain.y}`}
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(140,165,200,0.28)"
              strokeWidth={1.4}
            />

            {/* Líneas guía hacia el punto */}
            {(["halluc", "ok", "abstain"] as const).map((key) => (
              <line
                key={key}
                x1={V[key].x}
                y1={V[key].y}
                x2={point.x}
                y2={point.y}
                stroke={rgb(COLORS[key], 0.25)}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            ))}

            {/* Vértices */}
            <Vertex
              cx={V.halluc.x}
              cy={V.halluc.y}
              color={COLORS.halluc}
              weight={out.halluc}
              label="Alucinación"
              anchor="middle"
              dy={-14}
            />
            <Vertex
              cx={V.ok.x}
              cy={V.ok.y}
              color={COLORS.ok}
              weight={out.ok}
              label="Aciertos"
              anchor="start"
              dy={24}
            />
            <Vertex
              cx={V.abstain.x}
              cy={V.abstain.y}
              color={COLORS.abstain}
              weight={out.abstain}
              label="«No sé»"
              anchor="end"
              dy={24}
            />

            {/* Halo + punto */}
            <motion.circle
              animate={{ cx: point.x, cy: point.y }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              r={26}
              fill="url(#tri-glow)"
            />
            <motion.circle
              animate={{ cx: point.x, cy: point.y }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              r={7}
              fill={pointColor}
              stroke="#050811"
              strokeWidth={2}
            />
          </svg>

          <span
            className="mt-2 font-mono text-xs uppercase tracking-widest"
            style={{ color: dominant.color }}
          >
            {dominant.label}
          </span>
        </div>
      </div>

      {/* Medidores */}
      <div className="space-y-4">
        <Meter label="Aciertos" value={out.ok} color={COLORS.ok} />
        <Meter label="Reconoce «no sé»" value={out.abstain} color={COLORS.abstain} />
        <Meter label="Alucinaciones" value={out.halluc} color={COLORS.halluc} />
      </div>

      <p className="font-mono text-xs text-dim">
        Idea clave: el RAG y el conocimiento reducen la ignorancia, pero es la
        libertad para decir «no sé» la que convierte lo que el modelo no sabe en
        una abstención honesta en lugar de una alucinación. Sube la presión al
        máximo con poco conocimiento y verás el punto trepar hacia el vértice rosa.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-sm text-muted">{label}</span>
        <span className="font-mono text-sm" style={{ color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function Meter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: readonly [number, number, number];
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-sm text-muted">{label}</span>
        <span className="font-mono text-sm" style={{ color: rgb(color) }}>
          {value}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${rgb(color, 0.5)}, ${rgb(color)})`,
          }}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

function Vertex({
  cx,
  cy,
  color,
  weight,
  label,
  anchor,
  dy,
}: {
  cx: number;
  cy: number;
  color: readonly [number, number, number];
  weight: number;
  label: string;
  anchor: "start" | "middle" | "end";
  dy: number;
}) {
  const tx = anchor === "start" ? cx - 6 : anchor === "end" ? cx + 6 : cx;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5 + (weight / 100) * 7} fill={rgb(color, 0.18)} />
      <circle cx={cx} cy={cy} r={4} fill={rgb(color)} />
      <text
        x={tx}
        y={cy + dy}
        textAnchor={anchor}
        className="font-mono"
        fontSize={11}
        fill={rgb(color)}
      >
        {label}
      </text>
    </g>
  );
}
