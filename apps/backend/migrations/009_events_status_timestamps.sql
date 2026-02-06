-- Add status transition timestamps to events.
ALTER TABLE events ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Backfill opened_at for existing rows
UPDATE events SET opened_at = created_at WHERE opened_at IS NULL;
