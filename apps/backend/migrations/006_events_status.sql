-- Add status column to events: open | closed | finished.
-- Backfill: phase = 'closed' -> status = 'closed'; abgeschlossen = true -> status = 'finished'; else status = 'open'.

ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'closed', 'finished'));

UPDATE events
SET status = CASE
  WHEN abgeschlossen = true THEN 'finished'
  WHEN phase = 'closed' THEN 'closed'
  ELSE 'open'
END;

CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
