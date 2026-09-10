# Task 40: Prometheus Metrics Collection

## Context
- **Priority**: P1 - Medium
- **Estimated Hours**: 0.5h
- **Component**: Operations / Metrics
- **Phase**: Phase 3
- **Stream**: Prometheus Stream
- **Dependencies**: Task 39

## Objective
Implement Prometheus metrics collection for all SWARM components with custom metrics for agent orchestration.

## Implementation
- Add prom-client to Next.js: expose /metrics endpoint
- Custom counters: agent_executions_total, workflow_runs_total
- Custom histograms: agent_duration_seconds, ai_request_duration_seconds
- Custom gauges: active_agents, queue_depth, cache_hit_rate
- Business metrics: active_orgs_total, monthly_cost_usd
- Configure Prometheus scrape config
- AlertManager rules for critical thresholds

## Acceptance Criteria
- [ ] GET /metrics returns valid Prometheus format
- [ ] All custom metrics present
- [ ] Prometheus scrapes successfully
- [ ] AlertManager rules active

## Deliverables
- `src/app/api/metrics/route.ts`
- `prometheus.yml`
- `alertmanager.yml`
