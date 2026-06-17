/**
 * PCA mínima (2 componentes) vía iteración de potencias sobre la matriz de
 * covarianza, con deflación. Suficiente para proyectar unas decenas de
 * vectores de embeddings a un plano 2D de forma interpretable.
 */
export type Point2D = { x: number; y: number };

function centerColumns(rows: number[][]): { centered: number[][]; dim: number } {
  const n = rows.length;
  const dim = rows[0]?.length ?? 0;
  const mean = new Float64Array(dim);
  for (const r of rows) for (let j = 0; j < dim; j++) mean[j] += r[j];
  for (let j = 0; j < dim; j++) mean[j] /= n || 1;
  const centered = rows.map((r) => r.map((v, j) => v - mean[j]));
  return { centered, dim };
}

function covariance(centered: number[][], dim: number): Float64Array {
  // cov[i*dim + j] = sum_k centered[k][i] * centered[k][j]
  const cov = new Float64Array(dim * dim);
  for (const row of centered) {
    for (let i = 0; i < dim; i++) {
      const ri = row[i];
      if (ri === 0) continue;
      const base = i * dim;
      for (let j = i; j < dim; j++) {
        cov[base + j] += ri * row[j];
      }
    }
  }
  // simetrizar
  for (let i = 0; i < dim; i++)
    for (let j = i + 1; j < dim; j++) cov[j * dim + i] = cov[i * dim + j];
  return cov;
}

function matVec(cov: Float64Array, v: Float64Array, dim: number): Float64Array {
  const out = new Float64Array(dim);
  for (let i = 0; i < dim; i++) {
    let s = 0;
    const base = i * dim;
    for (let j = 0; j < dim; j++) s += cov[base + j] * v[j];
    out[i] = s;
  }
  return out;
}

function normalize(v: Float64Array): number {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return n;
}

function powerIteration(cov: Float64Array, dim: number, iters = 80): Float64Array {
  let v: Float64Array = new Float64Array(dim);
  for (let i = 0; i < dim; i++) v[i] = Math.random() - 0.5;
  normalize(v);
  for (let it = 0; it < iters; it++) {
    v = matVec(cov, v, dim);
    normalize(v);
  }
  return v;
}

function deflate(cov: Float64Array, v: Float64Array, dim: number) {
  // eigenvalue aproximado lambda = v^T cov v
  const cv = matVec(cov, v, dim);
  let lambda = 0;
  for (let i = 0; i < dim; i++) lambda += v[i] * cv[i];
  for (let i = 0; i < dim; i++)
    for (let j = 0; j < dim; j++) cov[i * dim + j] -= lambda * v[i] * v[j];
}

export function pca2(vectors: Float32Array[] | number[][]): Point2D[] {
  const rows = vectors.map((v) => Array.from(v));
  if (rows.length === 0) return [];
  const { centered, dim } = centerColumns(rows);
  const cov = covariance(centered, dim);
  const pc1 = powerIteration(cov, dim);
  deflate(cov, pc1, dim);
  const pc2 = powerIteration(cov, dim);
  const pts = centered.map((row) => {
    let x = 0;
    let y = 0;
    for (let j = 0; j < dim; j++) {
      x += row[j] * pc1[j];
      y += row[j] * pc2[j];
    }
    return { x, y };
  });
  return rescale(pts);
}

function rescale(pts: Point2D[]): Point2D[] {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const sx = maxX - minX || 1;
  const sy = maxY - minY || 1;
  return pts.map((p) => ({
    x: (p.x - minX) / sx,
    y: (p.y - minY) / sy,
  }));
}
