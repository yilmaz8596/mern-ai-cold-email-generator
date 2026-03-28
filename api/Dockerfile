
# Multi-stage Dockerfile for the api service.
# Stages:
#  - deps: installs all dependencies (dev + prod) used by builder and dev.
#  - deps-prod: installs production-only dependencies used by the final runner image.
#  - builder: compiles the TypeScript app into /app/dist.
#  - dev: development image used for hot-reload (`npm run dev`) with source mounted.
#  - runner: minimal production image containing only built artifacts and prod deps.
#
# Dev workflow: `docker compose -f docker-compose.dev.yml up --build`
# Prod workflow: `docker build --target runner -t api:prod ./api && docker run -p 5000:5000 api:prod`

FROM node:22-alpine as deps

WORKDIR /app

# Copy package files (package-lock.json will be copied if present)
COPY package*.json tsconfig.json ./

# Install dependencies: prefer `npm ci` when a lockfile exists, otherwise fall back to `npm install`.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Production-only dependencies (smaller final image)
FROM node:22-alpine as deps-prod

WORKDIR /app

# Copy lockfile so npm ci can be used (avoids slow dep resolution)
COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:22-alpine as builder

WORKDIR /app 

COPY --from=deps /app/node_modules ./node_modules 

COPY . . 

RUN npm run build 


FROM node:22-alpine as dev

WORKDIR /app

# Development image: include dev deps and run the watch/dev script.
ENV NODE_ENV=development
ENV PORT=5000
ENV HOST=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]


FROM node:22-alpine as runner 

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000 
ENV HOST=0.0.0.0 

COPY --from=builder /app/dist ./dist
COPY --from=deps-prod /app/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "dist/index.js"]

