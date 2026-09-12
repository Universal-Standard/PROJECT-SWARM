-- Add workflow versioning metadata columns
ALTER TABLE workflow_versions
  ADD COLUMN IF NOT EXISTS parent_version_id VARCHAR,
  ADD COLUMN IF NOT EXISTS branch_name TEXT NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS tag TEXT,
  ADD COLUMN IF NOT EXISTS execution_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS success_rate INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_duration INTEGER NOT NULL DEFAULT 0;

-- Backfill branch_name for older rows
UPDATE workflow_versions
SET branch_name = 'main'
WHERE branch_name IS NULL;

-- Helpful indexes for version browsing
CREATE INDEX IF NOT EXISTS idx_workflow_versions_branch
  ON workflow_versions(workflow_id, branch_name, version DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_tag
  ON workflow_versions(tag)
  WHERE tag IS NOT NULL;
