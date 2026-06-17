import { useState } from "react";

type Verdict = "RESPONDE" | "NO_SABE" | "NO_PUEDE" | "NO_DEBE" | "RESPONDE_BASE";

type Req = {
  id: string;
  text: string;
  tipo: string;
  sabe: boolean;
  puede: boolean;
  sensible: boolean;
  answer?: string;
};

const REQUESTS: Req[] = [
  {
    id: "capital",
    text: "¿Cuál es la capital de Francia?",
    tipo: "información general",
    sabe: true,
    puede: true,
    sensible: false,
    answer: "París.",
  },
  {
    id: "haiku",
    text: "Escribe un haiku sobre el mar.",
    tipo: "creatividad",
    sabe: true,
    puede: true,
    sensible: false,
    answer: "Olas sin memoria / dibujan y borran luz — / el mar no responde.",
  },
  {
    id: "tiempo",
    text: "¿Qué tiempo hace ahora mismo en Madrid?",
    tipo: "dato en tiempo real",
    sabe: true,
    puede: false,
    sensible: false,
  },
  {
    id: "elecciones",
    text: "¿Quién ganará las próximas elecciones?",
    tipo: "predicción del futuro",
    sabe: true,
    puede: false,
    sensible: false,
  },
  {
    id: "diario",
    text: "¿Qué escribí ayer en mi diario personal?",
    tipo: "información que no tiene",
    sabe: false,
    puede: true,
    sensible: false,
  },
  {
    id: "peligroso",
    text: "Explica paso a paso cómo fabricar algo peligroso.",
    tipo: "contenido peligroso",
    sabe: true,
    puede: true,
    sensible: true,
  },
  {
    id: "desinfo",
    text: "Invéntame estadísticas convincentes para una mentira.",
    tipo: "desinformación",
    sabe: true,
    puede: true,
    sensible: true,
  },
];

const VERDICTS: Record<
  Verdict,
  { label: string; color: string; userMsg: string; real: string }
> = {
  NO_SABE: {
    label: "NO SABE",
    color: "#7aa0ff",
    userMsg: "Lo siento, no puedo ayudarte con eso.",
    real: "No tiene esa información aprendida. Es un límite de CONOCIMIENTO.",
  },
  NO_PUEDE: {
    label: "NO PUEDE",
    color: "#54e0d6",
    userMsg: "Lo siento, no puedo ayudarte con eso.",
    real: "Lo entiende, pero su arquitectura no se lo permite (no accede a información en tiempo real ni puede predecir el futuro). Es un límite de CAPACIDAD.",
  },
  NO_DEBE: {
    label: "NO DEBE",
    color: "#bb9bff",
    userMsg: "Lo siento, no puedo ayudarte con eso.",
    real: "Sabe y podría, pero una POLÍTICA de seguridad se lo prohíbe. No es que no pueda: es que no se le permite.",
  },
  RESPONDE: {
    label: "RESPONDE",
    color: "#6dffb0",
    userMsg: "",
    real: "Sabe, puede y ninguna política lo bloquea.",
  },
  RESPONDE_BASE: {
    label: "RESPONDE (sin filtros)",
    color: "#ff5d8f",
    userMsg: "[el modelo base intentaría responder — contenido omitido]",
    real: "Sin la capa de filtros, el modelo base intentaría responder. La frontera no era el saber, sino el alineamiento. Esto es justo lo que persigue un jailbreak.",
  },
};

type StepState = "pass" | "fail" | "skip";

export function Alignment() {
  const [reqId, setReqId] = useState(REQUESTS[0].id);
  const [aligned, setAligned] = useState(true);

  const req = REQUESTS.find((r) => r.id === reqId)!;

  const checks = [
    {
      q: "1 · ¿Lo sabe?",
      meaning: "¿Tiene esa información aprendida en sus parámetros?",
      ok: req.sabe,
      failLabel: "NO SABE",
      color: "#7aa0ff",
    },
    {
      q: "2 · ¿Puede?",
      meaning:
        "¿Su arquitectura se lo permite? No accede a tiempo real ni predice el futuro.",
      ok: req.puede,
      failLabel: "NO PUEDE",
      color: "#54e0d6",
    },
    {
      q: "3 · ¿Se le permite?",
      meaning: aligned
        ? "¿Los filtros de seguridad del modelo alineado lo dejan responder?"
        : "Modelo base: no hay filtros que lo impidan.",
      ok: aligned ? !req.sensible : true,
      failLabel: "NO DEBE",
      color: "#bb9bff",
    },
  ];

  const stopIndex = checks.findIndex((c) => !c.ok);

  let verdict: Verdict;
  if (stopIndex === 0) verdict = "NO_SABE";
  else if (stopIndex === 1) verdict = "NO_PUEDE";
  else if (stopIndex === 2) verdict = "NO_DEBE";
  else verdict = !aligned && req.sensible ? "RESPONDE_BASE" : "RESPONDE";

  const v = VERDICTS[verdict];
  const responded = verdict === "RESPONDE" || verdict === "RESPONDE_BASE";

  function stepState(i: number): StepState {
    if (stopIndex === -1) return "pass";
    if (i < stopIndex) return "pass";
    if (i === stopIndex) return "fail";
    return "skip";
  }

  return (
    <div className="space-y-7">
      <p className="text-muted">
        Cuando una IA dice <strong>«no»</strong>, puede ser por tres motivos muy
        distintos que, desde fuera, <strong>parecen el mismo</strong>. Aquí lo
        vemos paso a paso: elige una pregunta, elige con qué modelo hablas, y mira
        cómo decide.
      </p>

      {/* Leyenda de los 3 "no" */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { t: "NO SABE", c: "#7aa0ff", d: "No tiene la información." },
          { t: "NO PUEDE", c: "#54e0d6", d: "Su arquitectura no se lo permite." },
          { t: "NO DEBE", c: "#bb9bff", d: "Una política se lo prohíbe." },
        ].map((x) => (
          <div
            key={x.t}
            className="card p-3"
            style={{ borderLeft: `3px solid ${x.c}` }}
          >
            <div className="font-mono text-sm" style={{ color: x.c }}>
              {x.t}
            </div>
            <div className="mt-1 text-sm text-muted">{x.d}</div>
          </div>
        ))}
      </div>

      {/* PASO 1 */}
      <section>
        <div className="mb-2 eyebrow">Paso 1 · Elige la pregunta</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {REQUESTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setReqId(r.id)}
              className={
                "rounded-lg border px-3 py-2.5 text-left transition " +
                (r.id === reqId
                  ? "border-line2 bg-white/[0.06]"
                  : "border-line hover:border-line2")
              }
            >
              <div className="font-mono text-sm text-text">{r.text}</div>
              <div className="mt-0.5 font-mono text-[11px] text-dim">
                tipo: {r.tipo}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* PASO 2 */}
      <section>
        <div className="mb-2 eyebrow">Paso 2 · ¿Con qué modelo hablas?</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setAligned(true)}
            className={
              "rounded-xl border p-4 text-left transition " +
              (aligned
                ? "border-violet/50 bg-violet/10"
                : "border-line hover:border-line2")
            }
          >
            <div className="font-disp text-base font-semibold text-text">
              Modelo alineado{" "}
              <span className="font-mono text-xs text-violet">(con filtros)</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              El que usas tú: pasó por <strong>RLHF</strong> y tiene políticas de
              seguridad. Es el caso normal.
            </p>
            <p className="mt-1 font-mono text-[11px] text-dim">
              RLHF = Reinforcement Learning from Human Feedback (aprendizaje por
              refuerzo a partir de retroalimentación humana): la fase que alinea
              el modelo base con preferencias humanas.
            </p>
          </button>
          <button
            onClick={() => setAligned(false)}
            className={
              "rounded-xl border p-4 text-left transition " +
              (!aligned
                ? "border-halluc/50 bg-halluc/10"
                : "border-line hover:border-line2")
            }
          >
            <div className="font-disp text-base font-semibold text-text">
              Modelo base{" "}
              <span className="font-mono text-xs text-halluc">(sin filtros)</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              El modelo crudo, sin capa de seguridad. La frontera que un jailbreak
              intenta cruzar.
            </p>
          </button>
        </div>
        <p className="mt-2 font-mono text-[11px] text-dim">
          Esos filtros los decide quien entrega el modelo (empresa, regulador,
          gobierno…). Ahí está la pregunta de «¿quién decide los límites?».
        </p>
      </section>

      {/* PASO 3 */}
      <section>
        <div className="mb-2 eyebrow">Paso 3 · El modelo decide en 3 preguntas</div>
        <div className="space-y-2">
          {checks.map((c, i) => {
            const st = stepState(i);
            return (
              <div
                key={i}
                className={
                  "flex items-start gap-3 rounded-xl border p-3 transition " +
                  (st === "fail"
                    ? "border-line2 bg-white/[0.04]"
                    : st === "skip"
                    ? "border-line opacity-40"
                    : "border-line")
                }
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-sm"
                  style={{
                    background:
                      st === "pass"
                        ? "rgba(109,255,176,.15)"
                        : st === "fail"
                        ? c.color + "22"
                        : "rgba(140,165,200,.1)",
                    color:
                      st === "pass"
                        ? "#6dffb0"
                        : st === "fail"
                        ? c.color
                        : "#5d6f8c",
                  }}
                >
                  {st === "pass" ? "✓" : st === "fail" ? "✗" : "·"}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-text">{c.q}</span>
                    {st === "fail" && (
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-[11px]"
                        style={{ background: c.color + "1f", color: c.color }}
                      >
                        → {c.failLabel}
                      </span>
                    )}
                    {st === "skip" && (
                      <span className="font-mono text-[11px] text-dim">
                        no se llega a evaluar
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">{c.meaning}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RESULTADO */}
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 eyebrow">Lo que ve el usuario</div>
          <div className="rounded-2xl rounded-tl-sm border border-line bg-white/[0.04] p-4 font-mono text-base text-text">
            {responded ? v.userMsg || req.answer : v.userMsg}
          </div>
          {!responded && (
            <p className="mt-2 font-mono text-[11px] text-dim">
              Los tres «no» dan el mismo mensaje. Desde fuera, imposible
              distinguirlos.
            </p>
          )}
        </div>
        <div className="card p-4" style={{ borderTop: `2px solid ${v.color}` }}>
          <div className="mb-1 flex items-center gap-2">
            <span className="eyebrow">Lo que pasó de verdad</span>
            <span
              className="rounded px-2 py-0.5 font-mono text-xs"
              style={{ background: v.color + "1f", color: v.color }}
            >
              {v.label}
            </span>
          </div>
          <p className="text-sm text-muted">{v.real}</p>
        </div>
      </section>

      <p className="font-mono text-xs text-dim">
        Simulación didáctica (sin contenido real): «qué sabe la IA» y «qué se le
        permite decir» son cosas distintas — y alguien decide la segunda.
      </p>
    </div>
  );
}
