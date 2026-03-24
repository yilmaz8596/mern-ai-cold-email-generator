# Development Dockerfile for the React client (Vite)
# - Designed for local development with bind-mounts and hot-reload.
FROM node:22-alpine as deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

FROM node:22-alpine as dev

WORKDIR /app

# Development settings
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=5173

# Copy node_modules from deps stage then app source (source will typically be mounted by compose)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

# Start Vite and bind to 0.0.0.0 so the dev server is accessible from the host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
