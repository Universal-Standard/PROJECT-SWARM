# PROJECT-SWARM Platform Variants

This directory contains two self-contained deployments of PROJECT-SWARM, each using a different cloud ecosystem with zero external dependencies.

## Comparison

| Feature | `github/` | `cloudflare/` |
|---|---|---|
| **Frontend hosting** | GitHub Pages | Cloudflare Pages |
| **Backend API** | GitHub Actions (workflow_dispatch) | Cloudflare Workers (Hono.js) |
| **Database** | SQLite committed in repo (`swarm.db`) | Cloudflare D1 (SQLite at edge) |
| **Authentication** | GitHub OAuth (secrets in Actions) | GitHub OAuth (secrets in Worker) |
| **Sessions** | localStorage (JWT-like token) | Cloudflare KV |
| **Real-time updates** | Polling (3s active, 30s idle) | Durable Objects WebSockets |
| **AI execution** | GitHub Actions runners | Cloudflare Queues |
| **File storage** | GitHub Gists + Releases | Cloudflare R2 |
| **Knowledge base** | GitHub Discussions | D1 `knowledge_entries` table |
| **Scheduling** | GitHub Actions cron triggers | Workers Cron Triggers |
| **Webhooks** | `repository_dispatch` events | Hono.js webhook route |
| **Cost** | **$0/month** (Free tier) | **~$5/month** (Workers Paid) |
| **API latency** | 10-30s (Actions cold start) | <50ms (edge) |
| **Scalability** | ~700-2000 API calls/month free | 10M requests/month |

## Directory Structure

```
platforms/
├── shared/
│   └── api-client.interface.ts    # TypeScript interface both variants implement
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
└── cloudflare/
    ├── SETUP.md                   # 5-step setup guide
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── wrangler.toml              # All Cloudflare bindings
    ├── migrations/
    │   └── 0001_initial.sql      # D1 schema
    └── worker/src/
        ├── index.ts               # Worker entry (Hono + Queue + Cron)
        ├── types.ts               # Env + job interfaces
        ├── db.ts                  # D1 database helpers
        ├── auth.ts                # GitHub OAuth exchange
        ├── ai.ts                  # AI provider adapters
        ├── session.ts             # KV session management
        ├── durable-objects/
        │   └── execution-room.ts  # WebSocket rooms
        ├── queues/
        │   └── execution-processor.ts  # Async AI execution
        └── routes/
            ├── workflows.ts
            ├── executions.ts
            ├── auth.ts
            └── costs.ts
```

## Setup

- **GitHub variant**: see [`github/SETUP.md`](github/SETUP.md)
- **Cloudflare variant**: see [`cloudflare/SETUP.md`](cloudflare/SETUP.md)

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

Both variants use the same React frontend from `client/src/` and share the `platforms/shared/api-client.interface.ts` contract.
