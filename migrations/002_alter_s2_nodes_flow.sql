-- 20251215_alter_s2_nodes_flow.sql

-- 1) tambah MAIN "start" untuk flow awal call (greeting, input nama, dst)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 's2_main_type'::regtype
      AND enumlabel = 'start'
  ) THEN
    ALTER TYPE s2_main_type ADD VALUE 'start';
  END IF;
END $$;

-- 2) step_kind: step itu bisa script biasa atau input
ALTER TABLE s2_nodes
ADD COLUMN IF NOT EXISTS step_kind TEXT CHECK (step_kind IN ('script','input')) DEFAULT 'script';

-- 3) field input untuk step_kind=input
ALTER TABLE s2_nodes
ADD COLUMN IF NOT EXISTS input_key TEXT,
ADD COLUMN IF NOT EXISTS input_placeholder TEXT;

-- 4) next_id untuk flow linear (wizard)
ALTER TABLE s2_nodes
ADD COLUMN IF NOT EXISTS next_id BIGINT REFERENCES s2_nodes(id) ON DELETE SET NULL;

-- index (optional)
CREATE INDEX IF NOT EXISTS idx_s2_nodes_next_id ON s2_nodes(next_id);
