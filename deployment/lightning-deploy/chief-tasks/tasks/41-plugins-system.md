# Task 41: Plugin System & Marketplace

## Context
- **Priority**: P2 - Medium
- **Estimated Hours**: 1h
- **Component**: Core / Plugins
- **Phase**: Phase 3
- **Stream**: Plugins Stream
- **Dependencies**: Phase 2 complete

## Objective
Build a sandboxed plugin system allowing third-party developers to extend SWARM with custom agents, tools, and integrations.

## Implementation
- Define plugin manifest format: plugin.json
- Plugin types: agent, tool, integration, trigger
- Sandboxed execution: plugins run in isolated VM context
- Plugin registry API: publish, install, update, uninstall
- Built-in plugins: Slack, Jira, Linear, Notion integration
- Plugin marketplace UI: browse, install, rate plugins
- Plugin permissions: declare required scopes in manifest

## Acceptance Criteria
- [ ] Plugins install and execute in sandbox
- [ ] Built-in Slack plugin works
- [ ] Marketplace UI shows available plugins
- [ ] Plugin permissions enforced

## Deliverables
- `src/lib/plugins/loader.ts`
- `src/lib/plugins/sandbox.ts`
- `src/lib/plugins/registry.ts`
- `src/app/marketplace/`
