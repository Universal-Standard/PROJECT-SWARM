# Lightning Deploy — Reference Scaffold (Archived)

> ⚠️ **Reference material only — not wired into PROJECT-SWARM's build or CI.**
>
> This folder was migrated from `US-SPURS/SWARM` on 2026-09-10 during the SWARM
> repository consolidation. That repository contained no application code — only
> this scaffold, committed as `SWARM-complete.zip`. It is preserved here so the
> work isn't lost, **not** because it represents PROJECT-SWARM's current
> architecture or deployment path.

## What this is

A self-contained proposal for a phased, 24-hour "lightning deploy" rollout of a
SWARM variant targeting **Cloudflare Workers**, using a framework this scaffold
calls "ViNext" (see `chief-tasks/tasks/00-migrate-swarm-to-vinext-cloudflares-next.js-altern.md`),
with its own Prisma schema and a 30-phase GitHub Actions pipeline (auth, database,
Redis/Dragonfly, NATS, MCP integration, multitenancy, RBAC, monitoring, and more).

**Important differences from PROJECT-SWARM as it stands today:**

- **License**: `LICENSE` in this folder is **AGPL-3.0**. PROJECT-SWARM's root
  `LICENSE` is **MIT**. Do not assume AGPL terms apply outside this folder, and
  do not merge this folder's code into the main app without resolving that
  conflict first.
- **Stack**: this scaffold assumes a Prisma/PostgreSQL data layer and a
  "ViNext" frontend framework; PROJECT-SWARM's actual app (`/client`, `/server`)
  uses Drizzle ORM and a Vite + React + Express stack. The two are not
  interchangeable as-is.
- **Deployment automation**: `github-workflow-templates/` holds the original
  30 phase-*.yml workflow files **unmodified and un-activated** — they were
  copied here rather than into `.github/workflows/`, specifically so they do
  not start running against this repository. Review, adapt, and rename any you
  want to adopt before moving them into `.github/workflows/`.

## Contents

- `chief-tasks/` — phase task definitions (YAML) and detailed task specs
  (`chief-tasks/tasks/*.md`) for the 24-hour rollout plan
- `github-workflow-templates/` — the 30 original GitHub Actions workflow files,
  inert in this location
- `prisma/schema.prisma` — data model for the ViNext/Cloudflare variant
- `lightning-deploy.sh` — the original one-shot deploy script
- `vinext.config.js` — framework config for the proposed ViNext frontend
- `.env.example` — environment variables this scaffold expects
- `SOURCE_README.md` — the original repository's README, verbatim
- `LICENSE` — the original AGPL-3.0 license text (applies to this folder only)

## Provenance

Originally `US-SPURS/SWARM` (created 2026-03-14), packaged as
`SWARM-complete.zip`. Migrated here as part of consolidating four SWARM
repositories (`UniversalStandards/SWARM`, `Universal-Standard/SWARM`,
`US-SPURS/SWARM`, and this repository) into `Universal-Standard/PROJECT-SWARM`
as the single canonical SWARM codebase.
