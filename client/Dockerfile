# Development Dockerfile for the React client (Vite)
# - Designed for local development with bind-mounts and hot-reload.
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

FROM node:22-slim AS dev

WORKDIR /app

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=5173

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- Production build ---
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

