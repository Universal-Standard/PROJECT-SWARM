# PROJECT-SWARM setup guide

## Prerequisites

- Node.js 22.16 or newer
- npm
- PostgreSQL 16 or a compatible managed PostgreSQL service
- An application session secret and encryption key
- At least one AI provider key when executing AI agents

## Local setup

```bash
git clone https://github.com/Universal-Standard/PROJECT-SWARM.git
cd PROJECT-SWARM
npm ci
cp .env.example .env
# Edit .env with local PostgreSQL and application secrets.
npm run db:push
npm run check
npm test
npm run build
npm run dev
```

Open `http://localhost:5000` after the server starts. The application can
serve its health page and frontend without an AI provider key; a provider key
is required only when an AI-backed operation is invoked.

## Required runtime configuration

`DATABASE_URL`, `SESSION_SECRET`, and `ENCRYPTION_KEY` are required by the
server. Configure at least one provider key for the providers used by your
workflows. Configure `CRON_SECRET` only when an external scheduler will call
`GET /api/cron/tick`.

## Scheduling

Schedules are stored in PostgreSQL. Vercel uses the cron entry in
`vercel.json`; other deployments may set the repository variable
`CRON_BASE_URL` and repository secret `CRON_SECRET` to enable the optional
`.github/workflows/cron-tick.yml` trigger. The endpoint is fail-closed when
the secret is missing or invalid.

## Verification

Before opening a pull request, run:

```bash
npm run check
npm run lint
npm test
npm run build
```

Run `npm run test:e2e` when PostgreSQL and the Playwright browsers are
available.
