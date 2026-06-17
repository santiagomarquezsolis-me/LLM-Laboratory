import { LM_MODELS } from "../lib/transformers";

export function ModelPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const current = LM_MODELS.find((m) => m.id === value);
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Modelo</span>
        <span className="font-mono text-[11px] text-dim">{value}</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-lg border border-line2 bg-black/40 px-3 py-2.5 pr-9 font-mono text-sm text-text outline-none transition hover:border-signal focus:border-signal disabled:opacity-40"
        >
          {LM_MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-panel text-text">
              {m.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-signal">
          ▾
        </span>
      </div>
      {current && (
        <p className="mt-2 font-mono text-[11px] text-dim">{current.note}</p>
      )}
    </div>
  );
}
