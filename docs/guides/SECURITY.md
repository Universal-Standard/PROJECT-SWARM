# PROJECT-SWARM Security Policy

This document describes how security is handled in the PROJECT-SWARM codebase and deployments, and how to report security issues.

PROJECT-SWARM is an **AI workflow orchestration platform** that can integrate with external AI providers (OpenAI, Anthropic, Google Gemini, etc.), schedule and execute workflows, and store workflow definitions and execution logs. Because workflows may contain sensitive prompts and data, deployments **must be configured and operated securely**.

---

## 📬 Reporting a Vulnerability

If you discover a security issue in PROJECT-SWARM (code, configuration, or documentation):

- **Do not** open a public GitHub issue with sensitive details.
- Instead, send a detailed report to:

> **Security Contact**  
> Office of Information Technology  
> `github-security@spurs.gov`

Please include:

- A description of the vulnerability and where it was found.
- Steps to reproduce, including any sample requests or configuration.
- Expected vs actual behavior.
- Any potential impact you have identified.
- Environment details (e.g., Cloudflare Workers, self-hosted Linux/Windows, etc.).

We aim to acknowledge reports within **72 hours** and provide an initial assessment or mitigation plan as soon as possible.

If you are running a private fork or custom deployment, please also follow your internal security reporting processes, in addition to contacting the Office of Information Technology.

---

## 🔑 Secrets & Configuration

PROJECT-SWARM uses external services and requires **API keys and credentials**. These must **never** be committed to the repository.

### Use Environment Variables

All secrets should be configured via environment variables or platform-specific secret stores. Examples:

- **AI Providers**
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_GEMINI_API_KEY` (or equivalent)
- **Database**
  - `DATABASE_URL` / `DB_CONNECTION_STRING`
- **Other**
  - Webhook signing secrets
  - Encryption keys (if added)
  - Any third-party API tokens

#### Cloudflare Workers

For Cloudflare Workers, define secrets with:

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put DATABASE_URL
# etc.
```

Secrets must not appear in wrangler.toml or any committed file.

Vercel / Other Hosts
For Vercel or other platforms:

Use the provider’s secret / environment variable management.
Do not expose secrets to the client bundle (e.g., via VITE_* variables) unless absolutely necessary and explicitly intended to be public.

🔐 Authentication & Authorization
The PROJECT-SWARM repository can be used in different authentication setups. By default, it is not a complete authentication solution; you are expected to integrate your own identity provider or authentication layer for production deployments.

Recommended Practices
In any production or non-public environment:

Require Authentication

Protect all workflow management and monitoring endpoints behind authenticated access.
Use a trusted identity provider (e.g., enterprise SSO, OIDC, or other approved government identity solutions).
Implement Authorization

Restrict access to workflows, runs, logs, and configuration based on:
User identity
Project / tenant
Role (e.g., admin, editor, viewer)
Ensure users cannot access or modify workflows or logs that belong to other users, projects, or departments.
Session Security

Enforce HTTPS for all access.
Use secure, HTTP-only cookies for sessions when applicable.
Configure CSRF protection for browser-based state-changing requests.
The default development configuration is intended for local development only and is not hardened for multi-tenant or untrusted environments.

🧩 Webhooks, Triggers & External Inputs
PROJECT-SWARM can expose HTTP/webhook endpoints to trigger workflows.

To secure these endpoints:

Authentication

Require API keys, OAuth tokens, or signed requests for incoming triggers.
Reject unauthenticated or malformed requests.
Signature Verification

If using HMAC or provider-specific signatures, verify them before processing.
Reject requests where signatures do not match, are missing, or are expired.
Rate Limiting & Abuse Protection

Apply rate limiting at the edge (Cloudflare Workers / CDN / reverse proxy).
Log and monitor repeated failures or anomalous traffic patterns.
Input Validation

Validate all incoming JSON/body parameters.
Enforce reasonable size limits on payloads.
Reject unexpected fields or types where possible.

🧱 Data Protection & Privacy
Workflows and execution logs may contain:

Sensitive prompts
User data or PII
Internal business logic and system instructions
Storage
Use a secure database for storing workflows and logs (see drizzle.config.ts).
Restrict database access to the application and authorized administrators only.
Avoid storing plaintext secrets or credentials in the database.
Retention
Configure log and history retention according to applicable policy, legal, and compliance requirements.
Consider:
Automatically pruning old execution logs.
Anonymizing or minimizing sensitive data in stored logs where feasible.
Backups
Secure backups with encryption at rest.
Restrict backup access to authorized personnel.
Periodically test restore procedures.

🌐 External AI Providers
PROJECT-SWARM can call external AI APIs (e.g., OpenAI, Anthropic, Google Gemini).

When using external providers:

Review Provider Policies

Understand each provider’s data handling, retention, and training policies.
Ensure they meet government, organizational, and regulatory requirements.
Limit Data Sent

Send only the minimum necessary context to third-party models.
Avoid sending secrets, long-term tokens, or highly sensitive PII unless you have strong contractual and technical controls and explicit approval.
Network Security

Use HTTPS/TLS for all API calls.
Rely on standard libraries for certificate validation.
Key Management

Use separate API keys per environment (development, test, production).
Rotate keys periodically and immediately upon suspected compromise.


🧪 Secure Development & Dependencies
The project uses Node.js, Vite, React, and other JavaScript/TypeScript dependencies.

Recommended Practices
Keep Node.js and dependencies up to date.

Regularly run:
'npm audit'
'npm outdated'

Use dependency management tools (e.g., Renovate, Dependabot) to stay current.

Prefer minimal and well-maintained dependencies.

Review any new dependency that:

Runs code at build time.
Has access to the filesystem, network, or environment variables.
Code Security
Validate all user inputs on the server.
Use the ORM/query builder (Drizzle) safely; avoid constructing raw SQL strings.
Avoid eval, new Function, or other dynamic code execution patterns.
Sanitize data rendered in the UI to prevent XSS when displaying user-provided content.

🚀 Deployment Hardening
PROJECT-SWARM supports multiple deployment options (Cloudflare Workers, Cloudflare Pages, GitHub Pages, self-hosted, etc.). For production:

General
Use HTTPS for all endpoints.
Set secure HTTP security headers where possible:
HSTS
X-Content-Type-Options
X-Frame-Options
Content Security Policy (CSP)
Restrict admin and API endpoints via firewall, VPN, or approved network boundaries when feasible.
Monitor logs and metrics for anomalies.
Cloudflare Workers
Store secrets via wrangler secret only.
Use environment-specific bindings (e.g., dev, staging, production).
Configure durable objects / KV / D1 / other storage with least-privilege access.
GitHub Pages
Treat GitHub Pages deployments as static and public.
Do not embed secrets in any build artifact.
Do not rely on GitHub Pages for private API hosting.
Self-Hosted
Place the app behind a reverse proxy (nginx, Caddy, etc.) with TLS termination.
Keep the OS and runtime updated with security patches.
Restrict SSH and administrative access; use strong authentication and firewall rules.
Follow your organization’s baseline hardening standards for servers and containers.


🔄 Responsible Disclosure & Coordination
We encourage responsible disclosure:

Provide the Office of Information Technology a reasonable time window to investigate and fix issues before public disclosure.
We will:
Acknowledge receipt of your report.
Work to reproduce and assess impact.
Prepare a fix and/or mitigation.
Publish security-relevant release notes or advisories when appropriate.
For security-related usage questions (e.g., “How should I securely deploy PROJECT-SWARM in environment X?”) that are not vulnerabilities, you may open a regular GitHub issue with a security-question label or contact:

Office of Information Technology

github-security@spurs.gov

Last updated: 2025-12-08


