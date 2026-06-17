# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY llm-lab/package*.json ./
RUN npm install --no-audit --no-fund
COPY llm-lab/ .
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY llm-lab/package*.json ./
# Solo dependencias de producción (express) para la imagen final.
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY llm-lab/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
