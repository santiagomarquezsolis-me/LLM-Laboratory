import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");

const app = express();

// Activos estáticos del build de Vite.
app.use(
  express.static(dist, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

// SPA fallback: cualquier ruta sirve index.html.
app.get("*", (_req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`El Laboratorio del LLM escuchando en :${port}`);
});
