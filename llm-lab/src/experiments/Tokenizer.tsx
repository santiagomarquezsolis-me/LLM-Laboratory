import { useMemo, useState } from "react";
import { encode, decode } from "gpt-tokenizer";
import { prettyToken, colorForIndex } from "../lib/format";

const DEFAULT = "El gato está sentado sobre la alfombra.";

export function Tokenizer() {
  const [text, setText] = useState(DEFAULT);

  const tokens = useMemo(() => {
    if (!text) return [] as { id: number; piece: string }[];
    try {
      const ids = encode(text);
      return ids.map((id) => ({ id, piece: decode([id]) }));
    } catch {
      return [];
    }
  }, [text]);

  const charCount = [...text].length;

  return (
    <div className="space-y-6">
      <p className="text-muted">
        El modelo no ve palabras: ve <span className="text-signal">tokens</span>.
        Escribe algo y observa cómo el texto se fragmenta en piezas (subpalabras)
        y cómo cada una recibe un identificador numérico. Fíjate en los espacios y
        en cómo palabras raras se parten en varios tokens.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-xl border border-line bg-black/30 p-4 font-mono text-base text-text outline-none focus:border-signal"
        placeholder="Escribe aquí…"
      />

      <div className="flex flex-wrap gap-4 font-mono text-sm text-muted">
        <span>
          <span className="text-text">{charCount}</span> caracteres
        </span>
        <span>
          <span className="text-signal">{tokens.length}</span> tokens
        </span>
        <span>
          ratio{" "}
          <span className="text-text">
            {tokens.length ? (charCount / tokens.length).toFixed(2) : "—"}
          </span>{" "}
          car/token
        </span>
      </div>

      <div>
        <div className="mb-2 eyebrow">Tokens</div>
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((t, i) => (
            <span
              key={i}
              className="chip"
              style={{
                borderColor: colorForIndex(i) + "55",
                background: colorForIndex(i) + "14",
                color: "#eaf2ff",
              }}
              title={`id ${t.id}`}
            >
              {prettyToken(t.piece)}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 eyebrow">IDs</div>
        <code className="block overflow-x-auto rounded-xl border border-line bg-black/40 p-4 font-mono text-sm text-azure">
          [{tokens.map((t) => t.id).join(", ")}]
        </code>
      </div>

      <div className="card p-5">
        <div className="mb-3 eyebrow">¿Por qué se trocea así?</div>
        <ul className="space-y-2.5 text-sm text-muted">
          <li>
            <span className="text-text">No parte por palabras ni sílabas.</span>{" "}
            Usa un vocabulario fijo de ~100.000 piezas aprendido de forma
            estadística de un corpus dominado por inglés y código.
          </li>
          <li>
            <span className="text-text">El espacio cuenta:</span>{" "}
            <span className="font-mono text-signal">·sobre</span> (con espacio
            delante) es un token distinto de{" "}
            <span className="font-mono text-signal">sobre</span>.
          </li>
          <li>
            <span className="text-text">Frecuente → 1 token; raro → se parte.</span>{" "}
            Las palabras habituales tienen su propio token; las poco comunes se
            fragmentan en varias piezas.
          </li>
          <li>
            <span className="text-text">Sesgo hacia el inglés:</span> el español
            gasta más tokens (más caro, más lento, más contexto).{" "}
            <span className="font-mono text-warn">alfombra</span> = 3 tokens;{" "}
            <span className="font-mono text-warn">carpet</span> = 1.
          </li>
          <li>
            <span className="text-text">No hay comprensión, hay frecuencia.</span>{" "}
            El modelo opera sobre trozos estadísticos, no sobre el significado de
            las palabras.
          </li>
        </ul>
      </div>

      <p className="font-mono text-xs text-dim">
        Tokenizador <span className="text-muted">BPE</span> ={" "}
        <span className="text-muted">Byte Pair Encoding</span> (codificación por
        pares de bytes): junta de forma estadística los pares de caracteres más
        frecuentes hasta formar el vocabulario. Aquí usamos cl100k (el de
        GPT-3.5/4); corre al instante en el navegador, sin descargar ningún
        modelo.
      </p>
    </div>
  );
}
