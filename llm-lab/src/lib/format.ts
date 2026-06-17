/** Hace visibles los espacios y saltos de línea dentro de un token. */
export function prettyToken(tok: string): string {
  return tok.replace(/ /g, "·").replace(/\n/g, "⏎").replace(/\t/g, "⇥");
}

export function pct(p: number, digits = 1): string {
  return (p * 100).toFixed(digits) + "%";
}

const PALETTE = [
  "#54e0d6",
  "#7aa0ff",
  "#ffc24b",
  "#ff5d8f",
  "#bb9bff",
  "#6dffb0",
];

export function colorForIndex(i: number): string {
  return PALETTE[i % PALETTE.length];
}
