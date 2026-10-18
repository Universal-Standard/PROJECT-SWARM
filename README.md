# PROJECT-SWARM

PROJECT-SWARM is the canonical SWARM implementation in the Universal Standard
portfolio: a provider-neutral platform for designing, executing, and
observing cooperative AI workflows.

It provides a visual React/Vite workflow builder, an Express API, PostgreSQL
persistence through Drizzle ORM, multi-provider AI execution, scheduling,
webhooks, execution logs, knowledge persistence, versioning, and cost tracking.

## Architecture

```text
React + Vite frontend
          |
      Express API
          |
PostgreSQL + Drizzle ORM
          |
Provider adapters: OpenAI, Anthropic, Google Gemini
```

The application is designed around explicit contracts, durable state, bounded
execution, provider isolation, audit-friendly logs, and human control of
consequential actions. Provider SDKs are loaded lazily: the application can
start and expose health/frontend routes without an AI key, while an invoked
provider fails closed if its credential is not configured.

## Quick start

```bash
git clone https://github.com/Universal-Standard/PROJECT-SWARM.git
cd PROJECT-SWARM
npm ci
cp .env.example .env
# Configure PostgreSQL and application secrets in .env.
npm run db:push
npm run check
npm test
npm run build
npm run dev
```

Open `http://localhost:5000` to use the application.

## Configuration

Required server settings:

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — session-cookie signing secret
- `ENCRYPTION_KEY` — key used to protect stored provider credentials

Configure only the AI provider credentials required by your workflows:
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and/or `GEMINI_API_KEY`.

Set `CRON_SECRET` when a deployment platform or the optional GitHub Actions
trigger will call `GET /api/cron/tick`. The endpoint refuses requests when the
secret is absent or invalid.

See [.env.example](./.env.example), the [setup guide](./docs/SETUP-GUIDE.md),
and the [deployment documentation](./docs/deployment/) for details.

## Scheduling and runtime state

Schedules and execution state live in PostgreSQL. Vercel uses the scheduler
defined in `vercel.json`; other deployments can use the application cron
endpoint with an authenticated external scheduler.

GitHub Actions is used for CI, security checks, artifacts, and optional
operational triggers. It is not the application API or database, and runtime
state must never be committed to the repository. The former SQLite/GitHub-only
design is documented as retired in
[docs/GITHUB-ONLY-ARCHITECTURE.md](./docs/GITHUB-ONLY-ARCHITECTURE.md).

## Development and verification

```bash
npm run check          # TypeScript validation
npm run lint           # ESLint
npm test               # Unit and integration tests
npm run build          # Production frontend and server build
npm run test:e2e       # Playwright; requires PostgreSQL and browsers
```

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
Security reports belong in [SECURITY.md](./SECURITY.md).

## Universal Standard portfolio

PROJECT-SWARM is one component of the broader Universal Standard system:

- [UniversalStandards](https://github.com/UniversalStandards/UniversalStandards)
  — canonical engineering standards and reusable manifests
- [ATLANTIS-AI](https://github.com/Universal-Standard/ATLANTIS-AI) — strategic
  orchestration and knowledge tooling
- [CAROMAR](https://github.com/Universal-Standard/CAROMAR) — repository fork,
  copy, and merge tooling
- [Universal-Standard-MCP-Server](https://github.com/Universal-Standard/Universal-Standard-MCP-Server)
  — MCP interoperability layer

The former `Universal-Standard/SWARM` repository is deprecated in favor of
this repository. See [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) and
the [production-baseline migration record](./docs/migrations/2026-10-production-baseline.md).

## License

MIT — see [LICENSE](./LICENSE).
