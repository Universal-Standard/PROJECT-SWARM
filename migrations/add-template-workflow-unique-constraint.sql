DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'templates_workflow_id_unique'
  ) THEN
    ALTER TABLE templates
    ADD CONSTRAINT templates_workflow_id_unique UNIQUE (workflow_id);
  END IF;
END $$;
