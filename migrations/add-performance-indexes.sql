-- Performance Indexes for Production
-- Created: 2025-12-30
-- Purpose: Add missing indexes for query optimization
--
-- How to apply:
--   npm run db:indexes
--
-- How to verify:
--   npm run db:verify-indexes
--
-- This migration adds 40+ indexes for:
-- - Foreign key relationships
-- - Common WHERE clause columns
-- - ORDER BY columns
-- - Composite indexes for frequent query patterns
-- - Partial indexes for conditional queries

-- Workflows table indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_updated_at ON workflows(updated_at DESC);

-- Executions table indexes
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_completed_at ON executions(completed_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_executions_workflow_status ON executions(workflow_id, status);
CREATE INDEX IF NOT EXISTS idx_executions_user_status ON executions(user_id, status);

-- Agent messages indexes
CREATE INDEX IF NOT EXISTS idx_agent_messages_execution_id ON agent_messages(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_agent_id ON agent_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_timestamp ON agent_messages(timestamp DESC);

-- Execution logs indexes
CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON execution_logs(level);
CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON execution_logs(timestamp DESC);

-- Workflow schedules indexes
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_enabled ON workflow_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run ON workflow_schedules(next_run);

-- Composite for finding active schedules ready to run
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_active_next ON workflow_schedules(enabled, next_run) WHERE enabled = true;

-- Workflow versions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_created_at ON workflow_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_tag ON workflow_versions(tag) WHERE tag IS NOT NULL;

-- Workflow webhooks indexes
CREATE INDEX IF NOT EXISTS idx_workflow_webhooks_workflow_id ON workflow_webhooks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_webhooks_enabled ON workflow_webhooks(enabled);

-- Webhook logs indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Execution costs indexes
CREATE INDEX IF NOT EXISTS idx_execution_costs_execution_id ON execution_costs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_costs_agent_id ON execution_costs(agent_id);
CREATE INDEX IF NOT EXISTS idx_execution_costs_provider ON execution_costs(provider);
CREATE INDEX IF NOT EXISTS idx_execution_costs_timestamp ON execution_costs(timestamp DESC);

-- Composite for cost analytics queries
CREATE INDEX IF NOT EXISTS idx_execution_costs_timestamp_provider ON execution_costs(timestamp DESC, provider);

-- Provider pricing indexes
CREATE INDEX IF NOT EXISTS idx_provider_pricing_provider_model ON provider_pricing(provider, model);
CREATE INDEX IF NOT EXISTS idx_provider_pricing_effective_date ON provider_pricing(effective_date DESC);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(featured);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);

-- Composite for template browsing
CREATE INDEX IF NOT EXISTS idx_templates_featured_usage ON templates(featured, usage_count DESC) WHERE featured = true;

-- Knowledge entries indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_id ON knowledge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_source_execution_id ON knowledge_entries(source_execution_id) WHERE source_execution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_source_agent_id ON knowledge_entries(source_agent_id) WHERE source_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_agent_type ON knowledge_entries(agent_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_category ON knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_created_at ON knowledge_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_agent_category ON knowledge_entries(user_id, agent_type, category, confidence DESC);

-- Tags and workflow tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_workflow_tags_workflow_id ON workflow_tags(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tags_tag_id ON workflow_tags(tag_id);

-- Users indexes (for auth lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_replit_id ON users(replit_id) WHERE replit_id IS NOT NULL;

-- Sessions table (IDX_session_expire already exists from schema)
-- Note: sessions table uses 'sid', 'sess', and 'expire' fields

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_workflow_id ON agents(workflow_id);

-- Assistant chats indexes
CREATE INDEX IF NOT EXISTS idx_assistant_chats_user_id ON assistant_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_chats_created_at ON assistant_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_chats_updated_at ON assistant_chats(updated_at DESC);

-- Workflow schemas indexes
CREATE INDEX IF NOT EXISTS idx_workflow_schemas_workflow_id ON workflow_schemas(workflow_id);

-- Statistics and analyze
ANALYZE;

-- Output results
SELECT 'Performance indexes created successfully!' as status,
       COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';
