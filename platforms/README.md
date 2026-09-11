# PROJECT-SWARM Platform Variants

This directory contains two self-contained deployments of PROJECT-SWARM, each using a different cloud ecosystem with zero external dependencies.

## Comparison

| Feature | `github/` | `cloudflare/` | `netlify/` | `vercel/` |
|---|---|---|---|---|
| **Frontend hosting** | GitHub Pages | Cloudflare Pages | Netlify Pages (CDN) | Vercel Edge Network |
| **Backend API** | GitHub Actions (workflow_dispatch) | Cloudflare Workers (Hono.js) | Netlify Functions (Node.js) | Vercel Serverless (Node.js) |
| **Database** | SQLite committed in repo (`swarm.db`) | Cloudflare D1 (SQLite at edge) | Neon PostgreSQL | Neon PostgreSQL |
| **Authentication** | GitHub OAuth (secrets in Actions) | GitHub OAuth (secrets in Worker) | GitHub OAuth + express-session | GitHub OAuth + express-session |
| **Sessions** | localStorage (JWT-like token) | Cloudflare KV | In-memory (swap to PG for prod) | In-memory (swap to PG for prod) |
| **Real-time updates** | Polling (3s active, 30s idle) | Durable Objects WebSockets | Polling (3s active, 30s idle) | Polling (3s active, 30s idle) |
| **AI execution** | GitHub Actions runners | Cloudflare Queues | Synchronous in function | Synchronous in function |
| **File storage** | GitHub Gists + Releases | Cloudflare R2 | Neon / external URL | Neon / external URL |
| **Knowledge base** | GitHub Discussions | D1 `knowledge_entries` table | PostgreSQL table | PostgreSQL table |
| **Scheduling** | GitHub Actions cron triggers | Workers Cron Triggers | Not built-in (use Netlify Scheduled Functions) | Not built-in (use Vercel Cron) |
| **Webhooks** | `repository_dispatch` events | Hono.js webhook route | Netlify Function catch-all | Vercel Function catch-all |
| **Cost** | **$0/month** (Free tier) | **~$5/month** (Workers Paid) | **Free** (125k invocations/month) | **Free** (Hobby: 100k/day) |
| **API latency** | 10-30s (Actions cold start) | <50ms (edge) | 50-300ms (cold: 1-3s) | 50-200ms (cold: 1-2s) |
| **Function timeout** | N/A | CPU time limits | 26s free / 15min Pro | 60s Hobby / 15min Pro |
| **Scalability** | ~700-2000 API calls/month free | 10M requests/month | 125k invocations/month free | 100k invocations/day free |

## Directory Structure

```
platforms/
├── shared/
│   ├── api-client.interface.ts    # TypeScript interface both variants implement
│   └── server/
│       └── standalone-app.ts      # Shared Express app (GitHub OAuth, no Replit Auth)
├── github/
│   ├── SETUP.md                   # 5-step setup guide
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/lib/
│       ├── github-api-client.ts   # Actions dispatch + poll + artifact
│       ├── auth.ts                # GitHub OAuth via Actions
│       ├── realtime.ts            # Execution polling
│       └── storage-github.ts     # Gists, Releases, Discussions
├── cloudflare/
│   ├── SETUP.md                   # 5-step setup guide
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── wrangler.toml              # All Cloudflare bindings
│   ├── migrations/
│   │   └── 0001_initial.sql      # D1 schema
│   └── worker/src/
│       ├── index.ts               # Worker entry (Hono + Queue + Cron)
│       ├── types.ts               # Env + job interfaces
│       ├── db.ts                  # D1 database helpers
│       ├── auth.ts                # GitHub OAuth exchange
│       ├── ai.ts                  # AI provider adapters
│       ├── session.ts             # KV session management
│       ├── durable-objects/
│       │   └── execution-room.ts  # WebSocket rooms
│       ├── queues/
│       │   └── execution-processor.ts  # Async AI execution
│       └── routes/
│           ├── workflows.ts
│           ├── executions.ts
│           ├── auth.ts
│           └── costs.ts
├── netlify/
│   ├── SETUP.md                   # 5-step setup guide
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── netlify.toml               # Build + redirect + function config
│   └── netlify/functions/
│       └── api.ts                 # Netlify Function (serverless-http wrapper)
└── vercel/
    ├── SETUP.md                   # 5-step setup guide
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── vercel.json                # Routes + function config
    └── api/
        └── index.ts               # Vercel Serverless Function (serverless-http wrapper)
```

## Setup

- **GitHub variant**: see [`github/SETUP.md`](github/SETUP.md)
- **Cloudflare variant**: see [`cloudflare/SETUP.md`](cloudflare/SETUP.md)
- **Netlify variant**: see [`netlify/SETUP.md`](netlify/SETUP.md)
- **Vercel variant**: see [`vercel/SETUP.md`](vercel/SETUP.md)

## Which variant should I use?

**Choose `github/`** if you:
- Want zero infrastructure cost
- Are comfortable with 10-30s API latency (fine for AI workflows which take minutes)
- Want everything in one GitHub repository
- Don't want to manage any external accounts beyond GitHub

**Choose `cloudflare/`** if you:
- Need sub-second API responses
- Expect moderate-to-high usage (> 1000 API calls/month)
- Want real-time WebSocket log streaming
- Are comfortable with a ~$5/month Cloudflare paid plan
- Want globally distributed edge computing

**Choose `netlify/`** if you:
- Want a traditional serverless deployment on a familiar CDN
- Need generous free tier (125k function invocations/month)
- Want simple git-push-to-deploy workflow
- Are comfortable with Neon PostgreSQL as the database

**Choose `vercel/`** if you:
- Want the fastest DX (Vercel CLI, preview deployments per PR)
- Need tight GitHub/GitLab integration
- Want Next.js-like monorepo support (future)
- Are comfortable with Neon PostgreSQL as the database

Both `netlify/` and `vercel/` variants share `platforms/shared/server/standalone-app.ts` — a single Express app using GitHub OAuth and Neon PostgreSQL, wrapped with `serverless-http` for each platform.

Both `github/` and `cloudflare/` variants use the same React frontend from `client/src/` and share the `platforms/shared/api-client.interface.ts` contract.
