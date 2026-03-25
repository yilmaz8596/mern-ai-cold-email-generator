# Redis fallback & secret handling

## Purpose

This document explains how the `api` service chooses a Redis URL (local fallback vs an external provider like Upstash) and recommended secret-handling practices for development and production.

## How the Compose setup works

- The `api` service loads `./api/.env` (via `env_file`) and runs a small shell wrapper that sets `REDIS_URL` with a default fallback:

```
sh -c 'export REDIS_URL=${REDIS_URL:-redis://redis:6379} && npm run dev'
```

- Behaviour:
  - If `REDIS_URL` is defined in `./api/.env` (or exported in the shell that runs Compose), that value is used (e.g. an Upstash `rediss://...` URL).
  - If `REDIS_URL` is not defined, the service falls back to the local `redis` service at `redis://redis:6379` (the Compose network service name `redis`).

## Dev workflow examples

- Use local Redis (default dev): remove or leave `REDIS_URL` unset in `api/.env` and run:

```
docker compose up -d --build
```

- Use Upstash (or another external Redis): put the Upstash URL into `api/.env` (do NOT commit this file):

```
# in api/.env (example)
REDIS_URL="rediss://default:<UPSTASH_TOKEN>@loved-crow-66711.upstash.io:6379"

docker compose up -d --build
```

## Verification

- Confirm which URL the running container sees:

```
docker compose exec api env | findstr REDIS_URL

# quick programmatic check
docker compose exec api node -e "console.log(process.env.REDIS_URL)"
```

## Production / secret handling recommendations

- Never commit real credentials. Add `api/.env` to `.gitignore` and keep a safe `api/.env.example` with placeholders.
- For orchestrators that support secrets (Docker Swarm, Kubernetes): store credentials as secrets and avoid exposing them in plain env files.

Example using Docker secrets (Swarm or Compose with secrets support):

```yaml
services:
  api:
    image: your-image:latest
    secrets:
      - redis_url
    entrypoint: >-
      sh -c 'if [ -f /run/secrets/redis_url ]; then export REDIS_URL=$(cat /run/secrets/redis_url); fi && npm run start'

secrets:
  redis_url:
    external: true
```

Create the secret (on the manager host / CI):

```
printf '%s' 'rediss://default:<UPSTASH_TOKEN>@loved-crow-66711.upstash.io:6379' | docker secret create redis_url -
```

- For Kubernetes, put `REDIS_URL` into a `Secret` and mount it as an env var or volume.
- Rotate tokens regularly and restrict their scope where possible.

## Security notes

- `rediss://` indicates TLS — keep TLS/SSL enabled for external providers.
- Limit where secrets are stored (avoid plaintext in CI logs or repositories).
- Use `.env.example` to document required variables without including values.

## Quick checklist

- [ ] `api/.env` exists locally (not committed) for Upstash or other external Redis.
- [ ] `api/.env` is ignored by git (see `api/.gitignore`).
- [ ] `api/.env.example` present with placeholders for onboarding.
- [ ] Production secrets stored in a secrets manager or Docker/K8s secrets.
