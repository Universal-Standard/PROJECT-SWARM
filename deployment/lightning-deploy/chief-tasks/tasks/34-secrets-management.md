# Task 34: Encrypted Secrets Vault

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Security / Infrastructure
- **Phase**: Phase 2
- **Stream**: Secrets Stream
- **Dependencies**: Tasks 01-08

## Objective
Build an encrypted secrets vault allowing agents to securely store and access API keys, tokens, and credentials.

## Implementation
- Create SecretsVault service using AES-256-GCM encryption
- Secrets scoped to organization — cross-org access impossible
- CRUD API: POST /api/secrets, GET /api/secrets/:name, DELETE
- Secrets injected into agent env at runtime (never logged)
- Secret rotation: update value without updating references
- Audit log: who accessed which secret when
- Integration with GitHub Secrets API for CI/CD

## Acceptance Criteria
- [ ] Secrets encrypted at rest with AES-256
- [ ] Org isolation enforced
- [ ] Secret access logged
- [ ] Agents can read secrets at runtime
- [ ] Rotation doesn't break running agents

## Deliverables
- `src/lib/secrets/vault.ts`
- `src/app/api/secrets/route.ts`
