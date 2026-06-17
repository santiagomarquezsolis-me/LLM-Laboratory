# El Laboratorio del LLM

Demos interactivas que acompañan la charla **“Cuando una IA se equivoca con absoluta confianza”**. Todo corre **en el navegador** con [transformers.js](https://github.com/xenova/transformers.js): sin servidores de IA, sin claves de API y sin enviar datos a ningún sitio. El servidor solo sirve archivos estáticos.

## Experimentos (MVP)

| # | Experimento | Qué enseña | Modelo |
|---|-------------|------------|--------|
| 01 | **Tokenizador** | El texto se trocea en tokens con IDs | BPE cl100k (instantáneo) |
| 02 | **Siguiente token** | `P(tokenₜ₊₁ \| contexto)` con barras de probabilidad reales | distilgpt2 |
| 03 | **Temperatura** | Cómo T pasa de predecible a delirante | distilgpt2 |
| 04 | **Espacio semántico** | El significado como geometría (PCA + analogías) | all-MiniLM-L6-v2 |

La primera vez que abres un experimento se descargan los pesos del modelo (quedan en la caché del navegador); a partir de ahí el cálculo es local.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:5173.

## Build de producción

```bash
npm run build      # genera dist/
npm start          # sirve dist/ con Express en el puerto $PORT (def. 3000)
```

## Desplegar en Railway

El repo incluye `Dockerfile` y `railway.json`, así que Railway lo detecta solo.

1. Sube esta carpeta (`llm-lab/`) a un repositorio de GitHub.
2. En Railway: **New Project → Deploy from GitHub repo** y elige el repo.
   - Si el proyecto está en una subcarpeta, ajusta el **Root Directory** a `llm-lab`.
3. Railway construye con el `Dockerfile` y arranca con `node server.js`.
4. Usa el `PORT` que inyecta Railway automáticamente (el servidor ya lo lee).
5. **Generate Domain** para obtener la URL pública.

> Alternativa sin Docker: Railway también funciona con Nixpacks. Bastaría con
> los scripts `build` y `start` del `package.json`; borra o ignora el
> `Dockerfile` si prefieres esa vía.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (tema neón heredado de la presentación)
- Framer Motion (animaciones)
- @xenova/transformers (modelos en el navegador) + gpt-tokenizer
- Express (solo para servir el build estático)

## Notas

- Los modelos de generación (distilgpt2) están entrenados sobre todo en inglés:
  los ejemplos por defecto del “siguiente token” y “temperatura” van en inglés
  para que las probabilidades luzcan mejor.
- Rendimiento: por defecto usa WASM. Si el navegador soporta WebGPU, transformers.js
  puede acelerarlo; para una demo en directo, precarga cada experimento una vez
  antes de empezar para que los pesos queden en caché.
