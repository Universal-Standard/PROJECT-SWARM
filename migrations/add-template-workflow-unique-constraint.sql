WITH ranked_templates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY workflow_id
      ORDER BY created_at ASC, id ASC
    ) AS duplicate_rank
  FROM templates
)
DELETE FROM templates
WHERE id IN (
  SELECT id
  FROM ranked_templates
  WHERE duplicate_rank > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'templates_workflow_id_unique'
      AND conrelid = 'templates'::regclass
  ) THEN
    ALTER TABLE templates
    ADD CONSTRAINT templates_workflow_id_unique UNIQUE (workflow_id);
  END IF;
END $$;
