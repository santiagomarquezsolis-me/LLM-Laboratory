import { useCallback, useState } from "react";
import type { ProgressInfo, ProgressCb } from "./transformers";

export type LoadState = {
  loading: boolean;
  ready: boolean;
  label: string;
  progress: number; // 0..1
  error: string | null;
};

const initial: LoadState = {
  loading: false,
  ready: false,
  label: "",
  progress: 0,
  error: null,
};

/**
 * Hook que envuelve una llamada async a un modelo y expone el progreso de
 * descarga para pintar una barra de carga bonita.
 */
export function useModelTask() {
  const [state, setState] = useState<LoadState>(initial);

  const onProgress: ProgressCb = useCallback((info: ProgressInfo) => {
    setState((s) => {
      if (info.status === "progress" && typeof info.progress === "number") {
        return {
          ...s,
          loading: true,
          label: `Descargando ${info.file ?? "modelo"}…`,
          progress: Math.min(1, info.progress / 100),
        };
      }
      if (info.status === "ready" || info.status === "done") {
        return { ...s, label: "Preparando…" };
      }
      return s;
    });
  }, []);

  const run = useCallback(
    async <T>(task: (cb: ProgressCb) => Promise<T>): Promise<T | undefined> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await task(onProgress);
        setState((s) => ({ ...s, loading: false, ready: true, progress: 1 }));
        return result;
      } catch (e: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message ?? String(e),
        }));
        return undefined;
      }
    },
    [onProgress]
  );

  return { state, run, setState };
}
