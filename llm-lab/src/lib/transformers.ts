/**
 * Carga perezosa de modelos que corren 100% en el navegador (transformers.js).
 * No hay API ni claves: la primera vez se descargan los pesos (cacheados por el
 * navegador) y a partir de ahí todo el cálculo es local.
 */
import {
  env,
  AutoTokenizer,
  AutoModelForCausalLM,
  pipeline,
} from "@xenova/transformers";

// Siempre desde el hub remoto (no buscar modelos locales).
env.allowLocalModels = false;

export type ProgressInfo = {
  status: string;
  file?: string;
  name?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};
export type ProgressCb = (info: ProgressInfo) => void;

// Modelos de lenguaje seleccionables para "siguiente token" y "temperatura".
export type LMOption = { id: string; label: string; note: string };
export const LM_MODELS: LMOption[] = [
  {
    id: "Xenova/distilgpt2",
    label: "distilGPT-2",
    note: "~85 MB · rápido · inglés",
  },
  { id: "Xenova/gpt2", label: "GPT-2", note: "~125 MB · inglés" },
  {
    id: "Xenova/LaMini-GPT-124M",
    label: "LaMini-GPT 124M",
    note: "instruido · responde a órdenes · inglés",
  },
  {
    id: "Xenova/bloom-560m",
    label: "BLOOM 560M",
    note: "multilingüe (incl. español) · más pesado y lento",
  },
];
export const DEFAULT_LM = LM_MODELS[0].id;

// Modelo de embeddings ligero para el "espacio semántico".
const EMB_ID = "Xenova/all-MiniLM-L6-v2";

// Caché por modelo: cada uno se descarga/instancia una sola vez.
const lmCache = new Map<string, Promise<{ tokenizer: any; model: any }>>();
let embPromise: Promise<any> | null = null;

export function getLanguageModel(
  modelId: string = DEFAULT_LM,
  onProgress?: ProgressCb
) {
  let p = lmCache.get(modelId);
  if (!p) {
    p = (async () => {
      const tokenizer = await AutoTokenizer.from_pretrained(modelId, {
        progress_callback: onProgress,
      });
      const model = await AutoModelForCausalLM.from_pretrained(modelId, {
        quantized: true,
        progress_callback: onProgress,
      });
      return { tokenizer, model };
    })();
    lmCache.set(modelId, p);
  }
  return p;
}

export function getEmbedder(onProgress?: ProgressCb) {
  if (!embPromise) {
    embPromise = pipeline("feature-extraction", EMB_ID, {
      quantized: true,
      progress_callback: onProgress,
    });
  }
  return embPromise;
}

export type TokenProb = {
  id: number;
  token: string;
  prob: number;
  logit: number;
};

function softmaxTopK(
  logits: Float32Array,
  temperature: number,
  topK: number
): { id: number; prob: number; logit: number }[] {
  const T = Math.max(0.01, temperature);
  // estabilidad numérica
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  const exps = new Float64Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp((logits[i] - max) / T);
    exps[i] = e;
    sum += e;
  }
  // top-k por logit (equivale a top-k por prob)
  const idx = Array.from({ length: logits.length }, (_, i) => i);
  idx.sort((a, b) => logits[b] - logits[a]);
  const out: { id: number; prob: number; logit: number }[] = [];
  for (let k = 0; k < Math.min(topK, idx.length); k++) {
    const i = idx[k];
    out.push({ id: i, prob: exps[i] / sum, logit: logits[i] });
  }
  return out;
}

function lastTokenLogits(logitsTensor: any): Float32Array {
  const dims: number[] = logitsTensor.dims; // [1, seq, vocab]
  const vocab = dims[dims.length - 1];
  const seq = dims[dims.length - 2];
  const data: Float32Array = logitsTensor.data;
  const start = (seq - 1) * vocab;
  return data.slice(start, start + vocab) as Float32Array;
}

export async function nextTokenDistribution(
  prompt: string,
  opts: { temperature?: number; topK?: number; modelId?: string } = {},
  onProgress?: ProgressCb
): Promise<TokenProb[]> {
  const { temperature = 1, topK = 12, modelId = DEFAULT_LM } = opts;
  const { tokenizer, model } = await getLanguageModel(modelId, onProgress);
  const text = prompt.length ? prompt : "\n";
  const inputs = await tokenizer(text);
  const output = await model(inputs);
  const logits = lastTokenLogits(output.logits);
  const top = softmaxTopK(logits, temperature, topK);
  return top.map((t) => ({
    ...t,
    token: tokenizer.decode([t.id]) as string,
  }));
}

/** Muestrea una continuación token a token (para el laboratorio de temperatura). */
export async function sampleContinuation(
  prompt: string,
  opts: { temperature?: number; maxTokens?: number; modelId?: string },
  onToken: (piece: string, full: string) => void,
  onProgress?: ProgressCb
): Promise<string> {
  const { temperature = 1, maxTokens = 14, modelId = DEFAULT_LM } = opts;
  const { tokenizer, model } = await getLanguageModel(modelId, onProgress);
  let text = prompt;
  for (let step = 0; step < maxTokens; step++) {
    const inputs = await tokenizer(text.length ? text : "\n");
    const output = await model(inputs);
    const logits = lastTokenLogits(output.logits);
    // muestreo sobre top-50 con temperatura
    const candidates = softmaxTopK(logits, temperature, 50);
    const r = Math.random();
    let acc = 0;
    let chosen = candidates[0];
    const norm = candidates.reduce((s, c) => s + c.prob, 0);
    for (const c of candidates) {
      acc += c.prob / norm;
      if (r <= acc) {
        chosen = c;
        break;
      }
    }
    const piece = tokenizer.decode([chosen.id]) as string;
    text += piece;
    onToken(piece, text);
    // pequeña pausa para que la animación se vea
    await new Promise((res) => setTimeout(res, 12));
  }
  return text;
}

export async function embed(
  text: string,
  onProgress?: ProgressCb
): Promise<Float32Array> {
  const extractor = await getEmbedder(onProgress);
  const out = await extractor(text, { pooling: "mean", normalize: true });
  return out.data as Float32Array;
}

export async function embedMany(
  words: string[],
  onProgress?: ProgressCb
): Promise<Float32Array[]> {
  const vecs: Float32Array[] = [];
  for (const w of words) {
    vecs.push(await embed(w, onProgress));
  }
  return vecs;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}
