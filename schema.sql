-- PROJECT-SWARM SQLite Database Schema
-- GitHub-Only Architecture (Path A/C)
-- Optimized for repository storage (target < 1.5GB, limit 2GB)
-- WAL mode enabled at runtime via: PRAGMA journal_mode = WAL;

-- =============================================================================
-- EXECUTION TRACKING
-- =============================================================================

-- Core execution metadata linked to GitHub Actions runs
CREATE TABLE IF NOT EXISTS execution_runs (
  id TEXT PRIMARY KEY,
  github_repo TEXT NOT NULL,           -- e.g., "owner/repo"
  github_run_id BIGINT NOT NULL,       -- GitHub Actions run ID (link to full logs)
  workflow_path TEXT NOT NULL,         -- Path to .swarm/workflows/*.yml
  status TEXT NOT NULL CHECK (status IN ('queued','in_progress','completed','failed')),
  started_at INTEGER NOT NULL,         -- Unix timestamp
  completed_at INTEGER,                -- Unix timestamp (NULL until done)
  cost_cents INTEGER DEFAULT 0,        -- Total cost in cents
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Cost breakdown per agent invocation
CREATE TABLE IF NOT EXISTS execution_costs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES execution_runs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,              -- openai, anthropic, google
  model TEXT NOT NULL,                 -- gpt-4, claude-3-5-sonnet, etc.
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Lightweight agent message log (key decisions only, not full transcripts)
CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES execution_runs(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('thought','action','result','communication')),
  content TEXT NOT NULL,               -- JSON or plain text
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Error and warning logs (skip INFO — those live in GitHub Actions logs)
CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES execution_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('error','warn')),
  message TEXT NOT NULL,
  metadata TEXT,                       -- JSON blob
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- =============================================================================
-- WORKFLOW STATS (aggregated counters — real definitions live in .swarm/ YAML)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_stats (
  workflow_path TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER DEFAULT 0,
  last_executed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (workflow_path, github_repo)
);

-- =============================================================================
-- USER PREFERENCES (GitHub OAuth users only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  github_user_id INTEGER PRIMARY KEY,
  github_username TEXT NOT NULL UNIQUE,
  default_provider TEXT,
  default_model TEXT,
  notification_settings TEXT,          -- JSON
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_runs_repo        ON execution_runs(github_repo);
CREATE INDEX IF NOT EXISTS idx_runs_status      ON execution_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_started     ON execution_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_github_id   ON execution_runs(github_run_id);
CREATE INDEX IF NOT EXISTS idx_costs_execution  ON execution_costs(execution_id);
CREATE INDEX IF NOT EXISTS idx_costs_provider   ON execution_costs(provider, model);
CREATE INDEX IF NOT EXISTS idx_messages_exec    ON agent_messages(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_execution   ON execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_stats_repo       ON workflow_stats(github_repo);

-- =============================================================================
-- TRIGGERS — keep updated_at current
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS trg_runs_updated
AFTER UPDATE ON execution_runs BEGIN
  UPDATE execution_runs SET updated_at = strftime('%s','now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_stats_updated
AFTER UPDATE ON workflow_stats BEGIN
  UPDATE workflow_stats SET updated_at = strftime('%s','now')
  WHERE workflow_path = NEW.workflow_path AND github_repo = NEW.github_repo;
END;

CREATE TRIGGER IF NOT EXISTS trg_prefs_updated
AFTER UPDATE ON user_preferences BEGIN
  UPDATE user_preferences SET updated_at = strftime('%s','now')
  WHERE github_user_id = NEW.github_user_id;
END;
