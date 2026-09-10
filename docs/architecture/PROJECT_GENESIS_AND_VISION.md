# PROJECT-SWARM: Genesis & Original Vision

> Extracted from the "Software redesign and enhancement" conversation (Claude,
> October 7, 2025) that produced the first working version of this platform.
> The raw conversation exports previously lived at `assets/conversations/` and
> have been removed — this document preserves what's actually useful from
> them. See **Provenance** at the bottom for source details and how this
> relates to the unrelated `deployment/lightning-deploy/` archive.

## Origin

The project began as a request to take an existing single-file HTML prototype
— a multi-step setup wizard for configuring AI agent workflows built on an
older React Flow version, with no real backend, no persistence, and no actual
GitHub or AI-provider integration — and rebuild it as a fully production-ready
platform: professional, error-free, ahead of its time, and with AI assistance
built into the setup process itself.

That request was scoped into five sequential builds ("Outputs"), each handed
off as a batch of generated files:

| Output | Scope | What it delivered |
|---|---|---|
| 1 | Foundation & Architecture | Application structure, TypeScript config, styling system, routing |
| 2 | Authentication & AI Integration | GitHub OAuth, multi-provider AI config (Claude, GPT, Gemini), agent template library |
| 3 | Dashboard & Workflows | Visual workflow builder (React Flow), custom node types, agent configuration UI |
| 4 | Execution Engine | Workflow orchestrator, multi-provider AI executor, WebSocket real-time updates, execution monitoring |
| 5 | Deployment & Documentation | Docker, Kubernetes manifests, CI/CD, Prometheus/Grafana monitoring, load testing, docs |

## Framework migration since Output 1

**Important:** Outputs 1–5 were built on **Next.js 14+** (`next-auth`,
`.next/standalone` build output, a Next.js-specific multi-stage Dockerfile).
PROJECT-SWARM's actual codebase today is **Vite + React + Express**
(`/client`, `/server`, Drizzle ORM) — a full framework migration happened at
some point after this conversation. Nothing framework-specific from the
original conversation (the Dockerfile, `next-auth` config, `.next` build
paths) applies to the current app as written. What still holds is the
*product* vision and the conceptual shape of Outputs 1–4, which the current
app implements: OAuth + multi-provider AI config, a visual workflow builder
with the same custom node types, and a WebSocket-driven execution engine —
just on a different stack.

## What endures: the original vision

The core product vision from that conversation is still an accurate
description of what PROJECT-SWARM is for, independent of framework:

- Real GitHub OAuth & repository integration
- Live AI assistance during setup and workflow building
- Multi-model support (OpenAI, Anthropic, Google, and — per the original
  plan — open-source/self-hosted models)
- Real-time workflow execution & monitoring
- Persistent state via a backend API and database
- Agent collaboration visualization
- AI-powered workflow/agent recommendations
- Execution logs and debugging tools
- A template library for instant deployment

## Candidate future directions (from the original session, unimplemented)

These were proposed as the platform's "expandable future" in the original
conversation. They are **ideas, not commitments or current roadmap items** —
listed here so they aren't lost, not because they're scheduled:

- Multi-cloud orchestration (AWS/GCP/Azure simultaneously, cross-cloud load
  balancing)
- Multi-model ensemble voting and automatic model selection by task
- Event-driven architecture (Kafka, webhook-triggered workflows)
- Full OpenTelemetry stack, distributed tracing, APM integration
- Enterprise SSO (SAML/OAuth), LDAP/Active Directory, SIEM integration
- Native mobile apps and an Electron desktop client
- End-to-end encryption, zero-trust architecture, compliance automation
  (SOC2, HIPAA, FedRAMP)

## Verified gap: Output 5 claims vs. the live repo

Output 5's closing summary claimed delivery of Kubernetes manifests with
auto-scaling, a 9-job CI/CD pipeline, a Prometheus/Grafana monitoring stack,
and a load-testing suite. As of this document, checking the live repo
directly:

- **No Kubernetes or Helm manifests exist anywhere in the repo.** Whatever
  was generated in Output 5 either never made it into this codebase or was
  removed during the framework migration.
- **No load-testing suite (k6 or otherwise) exists.**
- **CI/CD does exist** (`.github/workflows/`: `ci.yml`, `dependency-check.yml`,
  `deploy-github-pages.yml`, plus issue/PR automation), but it's shaped
  around the current Vite/Express/GitHub Pages reality, not the original
  Docker/K8s-oriented pipeline described in Output 5.
- **Prometheus/Grafana are referenced only inside
  `deployment/lightning-deploy/`** — an unrelated, explicitly archived
  scaffold from a different SWARM repository (see that folder's README). Its
  monitoring templates are not wired into this app and shouldn't be confused
  with genuine current coverage.

None of this blocks anything in production today — the current app doesn't
run on Kubernetes — but it's worth knowing that "monitoring" and "load
testing" were designed once and aren't actually present now, if either
becomes a real requirement.

## Provenance

- **Source:** Two Claude conversations, "Software redesign and enhancement -
  CONVO 1 of 2" and "CONVO 2 of 2" (created 2025-10-07, exported 2025-10-08),
  previously committed to this repo as raw JSON/PDF exports under
  `assets/conversations/`.
- **Why removed:** This repository is public. Raw conversation exports don't
  belong in a public repo's asset directory — they weren't referenced by any
  application code, added 7.2MB of dead weight to every clone, and the
  transcript format itself has no value once its substance is captured here.
- **Not the same thing as `deployment/lightning-deploy/`:** that folder is a
  separate, explicitly archived scaffold from a different repository
  (`US-SPURS/SWARM`, AGPL-licensed, Prisma/ViNext/Cloudflare-targeted),
  migrated in during a later repo consolidation. It has no connection to the
  October 2025 conversation this document is drawn from.
