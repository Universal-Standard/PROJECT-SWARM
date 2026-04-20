-- PROJECT-SWARM D1 Database Migration 0001: Initial Schema
-- Compatible with Cloudflare D1 (SQLite dialect)
-- WAL mode is managed by D1 automatically — do NOT set it here.

-- =============================================================================
-- EXECUTION TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS execution_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  github_repo TEXT,
  github_run_id INTEGER,
  workflow_path TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued','in_progress','completed','failed')),
  input TEXT,          -- JSON
  output TEXT,         -- JSON
  error TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  cost_cents INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS execution_costs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES execution_runs(id) ON DELETE CASCADE,
  agent_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd INTEGER NOT NULL DEFAULT 0,  -- micro-cents (1/1000000 USD)
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES execution_runs(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('thought','action','result','communication')),
  content TEXT NOT NULL,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES execution_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('error','warn','info')),
  message TEXT NOT NULL,
  metadata TEXT,
  step_index INTEGER,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- WORKFLOW DEFINITIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_defs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  nodes TEXT NOT NULL DEFAULT '[]',  -- JSON
  edges TEXT NOT NULL DEFAULT '[]',  -- JSON
  is_template INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS workflow_stats (
  workflow_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  last_executed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workflow_id, user_id)
);

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_user_id INTEGER UNIQUE,
  github_username TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  default_provider TEXT DEFAULT 'openai',
  default_model TEXT,
  theme TEXT DEFAULT 'system',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- KNOWLEDGE BASE
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  source_execution_id TEXT REFERENCES execution_runs(id) ON DELETE SET NULL,
  confidence INTEGER DEFAULT 80,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- TEMPLATES
-- =============================================================================

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_defs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- WEBHOOKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_webhooks (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_defs(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL REFERENCES workflow_webhooks(id) ON DELETE CASCADE,
  payload TEXT,   -- JSON
  headers TEXT,   -- JSON
  status TEXT NOT NULL,
  error TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_runs_workflow    ON execution_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_runs_user        ON execution_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_status      ON execution_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_started     ON execution_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_costs_execution  ON execution_costs(execution_id);
CREATE INDEX IF NOT EXISTS idx_costs_provider   ON execution_costs(provider, model);
CREATE INDEX IF NOT EXISTS idx_messages_exec    ON agent_messages(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_execution   ON execution_logs(execution_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_user   ON workflow_defs(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_user   ON knowledge_entries(user_id, agent_type, category);
