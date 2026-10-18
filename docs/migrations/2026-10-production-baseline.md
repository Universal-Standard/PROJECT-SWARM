# Production-baseline migration

## Decision

`Universal-Standard/PROJECT-SWARM` is the canonical SWARM repository. The
runtime data plane is the PostgreSQL-backed Express application. The former
repository SQLite/GitHub-Actions data plane is retired.

## Changes in this baseline

- Provider SDK clients are initialized lazily, so health checks and frontend
  startup do not require provider credentials. Provider calls still fail closed
  with an explicit configuration error when no key is available.
- The serverless scheduler evaluates `nextRun` before executing a schedule and
  coalesces overlapping ticks within a process. Deployments with multiple
  independently-triggered application instances must use one scheduler trigger
  or add a shared lease before enabling concurrent tick producers; the current
  per-process guard is not a distributed lock.
- SQLite database-writing and SQLite-dependent GitHub workflows were removed.
- Scheduling is represented by the authenticated `/api/cron/tick` endpoint,
  Vercel Cron, and an optional GitHub Actions HTTP trigger.
- Retired GitHub-only architecture documents were replaced with migration
  markers so old links do not silently describe an unsupported system.
- CI formatting is scoped to maintained application source and configuration,
  while generated and historical material is not treated as executable source.

## Deployment migration

1. Provision PostgreSQL and apply the current schema before deploying.
2. Configure `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`, and the AI
   provider credentials required by the deployed workflows.
3. Configure `CRON_SECRET` on the application and scheduler when schedules are
   enabled.
4. Do not restore `swarm.db`, `.swarm-data/`, or the deleted database-writing
   workflows.
5. Validate `/health`, `/ready`, and one authenticated workflow execution after
   deployment.

Historical SQLite data requires an explicit, reviewed export/import migration;
this baseline does not fabricate a migration from a database file that is not
present in the canonical repository.
