# PROJECT-SWARM implementation baseline

This file replaces the retired GitHub-only implementation plan. The canonical
implementation is the PostgreSQL-backed application in this repository.

## Source of truth

- Application data: PostgreSQL through Drizzle ORM and `shared/schema.ts`.
- API and execution behavior: `server/` and `api/`.
- Frontend: `client/`.
- Database evolution: `migrations/` and the reviewed `db:push` workflow.
- CI and deployment automation: `.github/workflows/` and deployment manifests.

## Operational rules

1. Runtime state must not be committed to Git.
2. GitHub Actions must not emulate the application API by editing a database
   file in the repository.
3. Scheduling must call the authenticated application cron endpoint or use the
   deployment platform's scheduler.
4. Changes to schema, execution, authentication, or provider behavior require
   tests and documentation updates.
5. Production readiness requires successful type checking, linting, unit and
   integration tests, end-to-end tests, build, and security checks.

See the [production-baseline migration record](./migrations/2026-10-production-baseline.md)
for the migration from the retired model.
