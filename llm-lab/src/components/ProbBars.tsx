import { motion } from "framer-motion";
import type { TokenProb } from "../lib/transformers";
import { prettyToken, pct } from "../lib/format";

export function ProbBars({
  tokens,
  onPick,
  highlightTop = true,
}: {
  tokens: TokenProb[];
  onPick?: (t: TokenProb) => void;
  highlightTop?: boolean;
}) {
  const max = tokens.length ? tokens[0].prob : 1;
  return (
    <div className="space-y-2.5">
      {tokens.map((t, i) => {
        const isTop = highlightTop && i === 0;
        return (
          <button
            key={t.id}
            onClick={() => onPick?.(t)}
            disabled={!onPick}
            className="group block w-full text-left"
          >
            <div className="mb-1 flex items-center justify-between font-mono text-sm">
              <span
                className={
                  "rounded px-1.5 py-0.5 " +
                  (isTop
                    ? "bg-signal/15 text-signal"
                    : "bg-white/5 text-text group-hover:bg-white/10")
                }
              >
                {prettyToken(t.token) || "∅"}
              </span>
              <span className={isTop ? "text-signal" : "text-muted"}>
                {pct(t.prob)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(t.prob / max) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                style={{
                  background: isTop
                    ? "linear-gradient(90deg,#54e0d6,#7aa0ff)"
                    : "rgba(122,160,255,.5)",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
