import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// transformers.js empaqueta onnxruntime-web (un bundle estilo webpack). Si se
// EXCLUYE del pre-bundling, en dev se carga como ESM crudo y sus módulos
// internos se inicializan en mal orden -> "Cannot read properties of undefined
// (reading 'registerBackend')" y pantalla en blanco. La solución es dejar que
// esbuild lo pre-bundlee (include) con target es2022.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6173,
    strictPort: true,
  },
  preview: {
    port: 6173,
    strictPort: true,
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    include: ["@xenova/transformers"],
    esbuildOptions: {
      target: "es2022",
    },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 2000,
  },
});
