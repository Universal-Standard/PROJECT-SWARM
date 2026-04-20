# Cloudflare Platform Setup Guide

Complete deployment of PROJECT-SWARM on Cloudflare: **Pages** (frontend) + **Workers** (backend API) + **D1** (database) + **KV** (sessions) + **Queues** (AI execution) + **Durable Objects** (WebSockets).

## Prerequisites

- Cloudflare account (free tier works for development; paid plan needed for Queues + full Durable Objects)
- Node.js 22+
- `wrangler` CLI (installed as dev dependency)

## Step 1 — Install and authenticate Wrangler

```bash
cd platforms/cloudflare
npm install
npx wrangler login
```

## Step 2 — Create Cloudflare resources

```bash
# Create D1 database
npx wrangler d1 create project-swarm-d1
# Copy the database_id output and update wrangler.toml [[d1_databases]] → database_id

# Create KV namespaces
npx wrangler kv:namespace create SESSIONS
npx wrangler kv:namespace create RATE_LIMIT
# Copy the ids and update wrangler.toml [[kv_namespaces]] → id

# Create R2 bucket
npx wrangler r2 bucket create project-swarm-files

# Create Queue
npx wrangler queues create workflow-executions
npx wrangler queues create workflow-executions-dlq
```

## Step 3 — Apply database migrations

```bash
# Local (for development)
npx wrangler d1 execute project-swarm-d1 --local --file=migrations/0001_initial.sql

# Remote (production)
npx wrangler d1 execute project-swarm-d1 --file=migrations/0001_initial.sql
```

## Step 4 — Set secrets

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ENCRYPTION_KEY
```

Also create a GitHub OAuth App at https://github.com/settings/applications/new:
- **Homepage URL**: your Cloudflare Pages URL (e.g., `https://project-swarm.pages.dev`)
- **Authorization callback URL**: `https://project-swarm.pages.dev/api/auth/github/callback`

## Step 5 — Deploy

```bash
npm run deploy
```

This runs:
1. `vite build` → frontend to `dist/`
2. `wrangler deploy worker/src/index.ts` → Worker deployed globally
3. `wrangler pages deploy dist/` → Frontend on Cloudflare Pages

Your app is live at `https://project-swarm.pages.dev` 🚀

## Local development

```bash
# Start local dev server (Pages + Worker + local D1/KV)
npm run dev
```

## GitHub Actions CI/CD

Add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN` — from https://dash.cloudflare.com/profile/api-tokens (use "Edit Cloudflare Workers" template)
- `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard overview

The `.github/workflows/build-deploy-cloudflare.yml` workflow will automatically deploy on every push to `main` that touches `platforms/cloudflare/`.

## Architecture Overview

```
Browser → Cloudflare Pages (React SPA)
             ↓ /api/* requests
         Cloudflare Worker (Hono.js API)
             ↓ reads/writes
         Cloudflare D1 (SQLite database)
             ↓ AI jobs enqueued
         Cloudflare Queues
             ↓ async execution
         Queue Consumer Worker → AI providers (OpenAI / Anthropic / Gemini)
             ↓ real-time updates
         Durable Objects (WebSocket rooms)
             ↑ connects
         Browser WebSocket
```

## Cost (Cloudflare paid plan — ~$5/month)

| Resource | Free Tier | Paid Plan |
|---|---|---|
| Workers requests | 100k/day | 10M/month |
| D1 reads | 5M/day | 25B/month |
| D1 writes | 100k/day | 50M/month |
| KV reads | 100k/day | 10M/month |
| R2 storage | 10GB | 10GB free + $0.015/GB |
| Queues messages | 1M/month | 5M/month |
| Pages builds | 500/month | unlimited |

Free tier is sufficient for development. Production at scale needs the $5/month Workers Paid plan.
