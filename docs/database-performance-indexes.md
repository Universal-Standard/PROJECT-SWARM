# Database Performance Indexes

This document details the performance indexes applied to the PROJECT-SWARM database and how to manage them.

## Overview

The database includes 57 carefully designed indexes to optimize query performance across all tables. These indexes were designed based on actual query patterns in the codebase.

## Index Categories

### 1. Foreign Key Indexes

Optimize JOIN operations and foreign key lookups:

- `workflows.user_id`
- `executions.workflow_id`, `executions.user_id`
- `agents.workflow_id`
- `agent_messages.execution_id`, `agent_messages.agent_id`
- And many more...

### 2. Timestamp Indexes

Speed up time-based queries and pagination:

- `workflows.created_at`, `workflows.updated_at` (DESC)
- `executions.started_at`, `executions.completed_at` (DESC)
- `agent_messages.timestamp` (DESC)
- `execution_logs.timestamp` (DESC)

### 3. Status/Filter Indexes

Optimize filtering by status or boolean fields:

- `executions.status`
- `workflow_schedules.enabled`
- `workflow_webhooks.enabled`
- `templates.featured`

### 4. Composite Indexes

Handle complex query patterns efficiently:

- `executions(workflow_id, status)` - For filtering executions by workflow and status
- `executions(user_id, status)` - For user execution dashboards
- `knowledge_entries(user_id, agent_type, category, confidence DESC)` - For knowledge retrieval
- `execution_costs(timestamp DESC, provider)` - For cost analytics

### 5. Partial Indexes

Optimize queries on sparse columns using WHERE clauses:

- `workflow_schedules(enabled, next_run) WHERE enabled = true`
- `templates(featured, usage_count DESC) WHERE featured = true`
- `users(replit_id) WHERE replit_id IS NOT NULL`
- `knowledge_entries(source_execution_id) WHERE source_execution_id IS NOT NULL`

## Table-by-Table Breakdown

### Workflows

```sql
idx_workflows_user_id ON workflows(user_id)
idx_workflows_created_at ON workflows(created_at DESC)
idx_workflows_updated_at ON workflows(updated_at DESC)
```

**Query patterns:** List workflows by user, sort by update time

### Executions

```sql
idx_executions_workflow_id ON executions(workflow_id)
idx_executions_user_id ON executions(user_id)
idx_executions_status ON executions(status)
idx_executions_started_at ON executions(started_at DESC)
idx_executions_completed_at ON executions(completed_at DESC)
idx_executions_workflow_status ON executions(workflow_id, status)
idx_executions_user_status ON executions(user_id, status)
```

**Query patterns:** Execution history, filtering by status, user dashboards

### Agent Messages

```sql
idx_agent_messages_execution_id ON agent_messages(execution_id)
idx_agent_messages_agent_id ON agent_messages(agent_id)
idx_agent_messages_timestamp ON agent_messages(timestamp DESC)
```

**Query patterns:** Message history for executions, chronological display

### Execution Logs

```sql
idx_execution_logs_execution_id ON execution_logs(execution_id)
idx_execution_logs_level ON execution_logs(level)
idx_execution_logs_timestamp ON execution_logs(timestamp DESC)
```

**Query patterns:** Log viewing, filtering by level, chronological order

### Workflow Schedules

```sql
idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id)
idx_workflow_schedules_enabled ON workflow_schedules(enabled)
idx_workflow_schedules_next_run ON workflow_schedules(next_run)
idx_workflow_schedules_active_next ON workflow_schedules(enabled, next_run) WHERE enabled = true
```

**Query patterns:** Scheduler finding next jobs to run, listing schedules per workflow

### Workflow Versions

```sql
idx_workflow_versions_workflow_id ON workflow_versions(workflow_id)
idx_workflow_versions_created_at ON workflow_versions(created_at DESC)
idx_workflow_versions_tag ON workflow_versions(tag) WHERE tag IS NOT NULL
```

**Query patterns:** Version history, tagged versions

### Workflow Webhooks & Logs

```sql
idx_workflow_webhooks_workflow_id ON workflow_webhooks(workflow_id)
idx_workflow_webhooks_enabled ON workflow_webhooks(enabled)
idx_webhook_logs_webhook_id ON webhook_logs(webhook_id)
idx_webhook_logs_timestamp ON webhook_logs(timestamp DESC)
idx_webhook_logs_status ON webhook_logs(status)
```

**Query patterns:** Webhook management, log viewing with status filtering

### Execution Costs

```sql
idx_execution_costs_execution_id ON execution_costs(execution_id)
idx_execution_costs_agent_id ON execution_costs(agent_id)
idx_execution_costs_provider ON execution_costs(provider)
idx_execution_costs_timestamp ON execution_costs(timestamp DESC)
idx_execution_costs_timestamp_provider ON execution_costs(timestamp DESC, provider)
```

**Query patterns:** Cost tracking per execution, analytics by provider over time

### Provider Pricing

```sql
idx_provider_pricing_provider_model ON provider_pricing(provider, model)
idx_provider_pricing_effective_date ON provider_pricing(effective_date DESC)
```

**Query patterns:** Looking up current pricing, historical pricing

### Templates

```sql
idx_templates_category ON templates(category)
idx_templates_featured ON templates(featured)
idx_templates_usage_count ON templates(usage_count DESC)
idx_templates_created_at ON templates(created_at DESC)
idx_templates_featured_usage ON templates(featured, usage_count DESC) WHERE featured = true
```

**Query patterns:** Template browsing, sorting by popularity, featured templates

### Knowledge Entries

```sql
idx_knowledge_entries_user_id ON knowledge_entries(user_id)
idx_knowledge_entries_source_execution_id ON knowledge_entries(source_execution_id) WHERE source_execution_id IS NOT NULL
idx_knowledge_entries_source_agent_id ON knowledge_entries(source_agent_id) WHERE source_agent_id IS NOT NULL
idx_knowledge_entries_agent_type ON knowledge_entries(agent_type)
idx_knowledge_entries_category ON knowledge_entries(category)
idx_knowledge_entries_created_at ON knowledge_entries(created_at DESC)
idx_knowledge_entries_user_agent_category ON knowledge_entries(user_id, agent_type, category, confidence DESC)
```

**Query patterns:** Knowledge retrieval for agents, filtering by type/category, confidence-based ranking

### Tags & Workflow Tags

```sql
idx_tags_name ON tags(name)
idx_workflow_tags_workflow_id ON workflow_tags(workflow_id)
idx_workflow_tags_tag_id ON workflow_tags(tag_id)
```

**Query patterns:** Tag lookups, workflows by tag, tags per workflow

### Users

```sql
idx_users_email ON users(email)
idx_users_replit_id ON users(replit_id) WHERE replit_id IS NOT NULL
```

**Query patterns:** Authentication, user lookups

### Agents

```sql
idx_agents_workflow_id ON agents(workflow_id)
```

**Query patterns:** Loading agents for a workflow

### Assistant Chats

```sql
idx_assistant_chats_user_id ON assistant_chats(user_id)
idx_assistant_chats_created_at ON assistant_chats(created_at DESC)
idx_assistant_chats_updated_at ON assistant_chats(updated_at DESC)
```

**Query patterns:** Chat history, recent chats

### Workflow Schemas

```sql
idx_workflow_schemas_workflow_id ON workflow_schemas(workflow_id)
```

**Query patterns:** Schema validation for workflows

## Managing Indexes

### Apply Indexes

```bash
npm run db:indexes
```

This runs the script at `scripts/apply-indexes.ts` which:

1. Reads the migration file
2. Connects to the database
3. Executes all CREATE INDEX statements
4. Reports success/failure

### Verify Indexes

```bash
npm run db:verify-indexes
```

This runs the script at `scripts/verify-indexes.ts` which:

1. Connects to the database
2. Queries pg_indexes for existing indexes
3. Compares against expected indexes
4. Reports missing indexes
5. Shows table sizes for context

### Check Index Usage

To see if indexes are being used by queries:

```sql
-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey';
```

### Drop Unused Indexes

If monitoring shows certain indexes are never used:

```sql
DROP INDEX IF EXISTS index_name;
```

## Performance Impact

### Expected Improvements

With proper indexes, you should see:

- **List queries:** 10-100x faster (e.g., listing workflows by user)
- **Filtered queries:** 50-500x faster (e.g., finding active schedules)
- **JOIN queries:** 5-50x faster (e.g., executions with workflow data)
- **ORDER BY queries:** 10-100x faster (e.g., recent executions)

### Trade-offs

Indexes come with costs:

- **Storage:** +10-20% database size
- **Write performance:** -5-10% on INSERTs/UPDATEs
- **Maintenance:** Indexes need occasional REINDEX

### Monitoring

Monitor query performance with:

```sql
-- Enable query logging (for development)
SET log_statement = 'all';
SET log_min_duration_statement = 100; -- Log queries > 100ms

-- Analyze a specific query
EXPLAIN ANALYZE
SELECT * FROM executions
WHERE workflow_id = 'abc123'
ORDER BY started_at DESC
LIMIT 10;
```

## Troubleshooting

### Indexes not being used

If EXPLAIN shows a sequential scan despite having an index:

1. **Update statistics:**

   ```sql
   ANALYZE table_name;
   ```

2. **Check index validity:**

   ```sql
   SELECT * FROM pg_indexes WHERE indexname = 'index_name';
   ```

3. **Verify index size:**

   ```sql
   SELECT pg_size_pretty(pg_relation_size('index_name'));
   ```

4. **Consider the query pattern** - Some queries may still do seq scans if:
   - Table is very small (< 1000 rows)
   - Query returns > 10% of table
   - Statistics are outdated

### Index bloat

Over time, indexes can become bloated and need rebuilding:

```sql
-- Check index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Rebuild bloated index
REINDEX INDEX CONCURRENTLY index_name;
```

## Additional Resources

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Index Types in PostgreSQL](https://www.postgresql.org/docs/current/indexes-types.html)
- [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
