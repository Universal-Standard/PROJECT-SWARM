ALTER TABLE executions
  ADD COLUMN IF NOT EXISTS workflow_version_id VARCHAR;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'executions_workflow_version_id_fk'
  ) THEN
    ALTER TABLE executions
      ADD CONSTRAINT executions_workflow_version_id_fk
      FOREIGN KEY (workflow_version_id)
      REFERENCES workflow_versions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_executions_workflow_version_id
  ON executions(workflow_version_id);
