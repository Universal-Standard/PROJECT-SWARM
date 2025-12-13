# PROJECT-SWARM Project Board Roadmap (Recommendations + Intake)

This roadmap creates a single GitHub Project board that operationalizes the previously recommended improvements and provides structured intake for bugs, features, and fixes.

> **Note:** The board column structure below introduces the "🧭 Triage" column, which is not present in the current `.github/PROJECT_BOARD_CONFIG.md`. This is a recommended update; maintainers should update the config to match this structure for consistency.
## Board Columns (canonical order)
1) **📥 New Intake** – default landing spot for every issue and PR via automation.
2) **🧭 Triage** – grooming queue; add priority, component, and effort fields.
3) **📋 Backlog** – accepted work; keep unprioritized items here.
4) **📝 Ready** – prioritized and sized; blocked items should move to 🚧 Blocked instead of sitting here.
5) **🔴 Blocked** – anything labeled `blocked` with a short blocker note.
6) **🚧 In Progress** – issues with `in-progress` or an open linked draft PR.
7) **👀 In Review** – linked PR marked “ready for review” or label `needs-review`.
8) **✅ Ready to Merge** – approved PRs with all checks green.
9) **🚀 Deployed** – merged to main and deployed; auto-close after verification.
10) **✨ Done** – verified in production; archive after 30 days.
11) **🐛 Critical Bugs** – filtered view: labels `bug` + `critical`.
12) **💡 Feature Requests** – filtered view: label `feature-request`, sorted by 👍 reactions.

> Automation: reuse `.github/PROJECT_BOARD_CONFIG.md` column rules; add two filters (Critical Bugs, Feature Requests) as saved views.

### Minimal automation with GitHub CLI (optional but recommended)
- Log in with `gh auth login` and select the following options when prompted:
  1. **Account type**: `GitHub.com`
  2. **Protocol**: `HTTPS`
  3. **Authentication method**: `Login with a web browser` (recommended) or `Paste an authentication token`
- Create the project: `gh project create --owner UniversalStandards --title "PROJECT-SWARM Delivery Board" --format board`.
- Add fields (Priority, Effort, Component, Group, Sprint):
  ```bash
  gh project field-create --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --name Priority --data-type SINGLE_SELECT --options "Critical,High,Medium,Low"
  gh project field-create --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --name Effort --data-type SINGLE_SELECT --options "XS (<1h),S (1-2h),M (3-5h),L (1-2d),XL (2+d)"
  gh project field-create --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --name Component --data-type SINGLE_SELECT --options "Workflow Builder,Execution Engine,AI Providers,GitHub Integration,Templates,UI/UX,Backend API,Database,Observability,Security,Infrastructure,Other"
  gh project field-create --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --name Group --data-type SINGLE_SELECT --options "Core,Auth,Monitoring,Knowledge,UX,Advanced,Future"
  gh project field-create --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --name Sprint --data-type ITERATION --iteration-duration 14
  ```
- Add saved views:
  ```bash
  gh project view --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --format yaml > /tmp/project.yaml
  # Manually add views named "Critical Bugs" (filter: label:bug label:critical) and "Feature Requests" (filter: label:feature-request sort:reactions)
  gh project edit --owner UniversalStandards --project "PROJECT-SWARM Delivery Board" --template /tmp/project.yaml
  ```
- In the project's settings UI, enable the "Auto-add" workflow to automatically add all new issues and pull requests from the repository to the project.

## Custom Fields
- **Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low
- **Effort**: XS (<1h) | S (1-2h) | M (3-5h) | L (1-2d) | XL (2+d)
- **Component**: Workflow Builder | Execution Engine | AI Providers | GitHub Integration | Templates | UI/UX | Backend API | Database | Observability | Security | Infrastructure | Other
- **Group**: Core | Auth | Monitoring | Knowledge | UX | Advanced | Future
- **Sprint**: Iteration field (2-week cadence)

## Intake & Tracking
- **Bugs:** use `ISSUE_TEMPLATE/01-bug-report.yml`; auto-label `bug`, `needs-triage`; route to 📥 New Intake.
- **Feature requests:** use `ISSUE_TEMPLATE/02-feature-request.yml`; auto-label `feature-request`; appears in 💡 Feature Requests view.
- **Tasks/maintenance:** use `03-task.yml` or `05-fix.yml`; label with component + priority.
- **Upgrades:** use `04-planned-upgrade.yml` for major refactors or platform shifts.

## Recommended Roadmap Issues (create as draft issues and add to board)
Each item lists recommended labels.

### Resilience & Safety
- **Implement retry/backoff and circuit breakers for external AI providers** – labels: `enhancement`, `critical`, `execution-engine`, `monitoring`.
- **Add per-user/workflow rate limiting and throttling** – labels: `enhancement`, `high`, `security`, `backend-api`.
- **Failure notification pipeline (Slack/email/webhook) with run attribution** – labels: `enhancement`, `medium`, `observability`, `ux`.

### Testing & Quality
- **End-to-end execution test suite (orchestrator + WebSocket monitor)** – labels: `testing`, `high`, `execution-engine`, `websockets`.
- **Provider mocks and regression fixtures for OpenAI/Anthropic/Gemini** – labels: `testing`, `medium`, `ai-providers`.
- **Type-check debt cleanup (server/lib/webhooks.ts, workflow-version, schema)** – labels: `fix`, `high`, `backend-api`, `typesafety`.

### Security & Dependency Hygiene
- **Resolve esbuild advisory and lockfile audit** – labels: `security`, `medium`, `dependencies`.
- **RBAC and multi-user permissions for workflows & secrets** – labels: `enhancement`, `high`, `auth`, `security`.

### Observability & Monitoring
- **Structured logging + request tracing across API and workers** – labels: `enhancement`, `medium`, `observability`, `backend-api`.
- **Metrics and alerting for executions (latency, error rate, cost)** – labels: `enhancement`, `high`, `observability`, `execution-engine`.

### Collaboration & Governance
- **Sharing/collaboration with audit trails** – labels: `enhancement`, `medium`, `ux`, `auth`.
- **Version-control sync (export/import workflows as code + Git hooks)** – labels: `enhancement`, `medium`, `github-integration`.

### Integration Marketplace
- **Connector SDK and marketplace curation** – labels: `planned-upgrade`, `medium`, `integrations`, `advanced`.
- **Webhook reliability (retries, DLQ, signature validation)** – labels: `enhancement`, `high`, `webhooks`, `security`.

### Deployment & Ops
- **Blue/green deploy playbook with rollback automation** – labels: `planned-upgrade`, `medium`, `infrastructure`, `ops`.
- **Environment config hardening (secrets management, linted env)** – labels: `fix`, `high`, `security`, `infrastructure`.

## Suggested Views
- **Sprint View:** filter by current iteration + `in-progress|in-review|ready-to-merge`.
- **QA Gate:** filter by column `👀 In Review` OR label `testing`; sort by priority.
- **Security Hotlist:** labels `security` OR `auth`; grouped by priority.
- **Observability:** labels `observability` OR `monitoring`; show metrics-related items.

## How to Stand Up the Board Quickly
1. Create a new GitHub Project (Board) named **“PROJECT-SWARM Delivery Board”**.
2. Apply column/automation rules from `.github/PROJECT_BOARD_CONFIG.md` and add the filtered views above.
3. Run `./scripts/create-labels.sh` to ensure labels exist.
4. Convert each roadmap bullet into a draft issue using the matching template; set fields (Priority, Effort, Component, Group, Sprint) before moving to 📥 New Intake.
5. Enable auto-add for new issues and PRs so bug reports, feature requests, and fixes flow into 📥 New Intake automatically.

This structure supports the recommended resilience, testing, security, and observability upgrades while keeping bug reports, feature requests, and maintenance tasks visible from intake through deployment.
