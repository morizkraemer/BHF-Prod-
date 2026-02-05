-- Add abgeschlossen flag to events (e.g. for db-viewer "closed" status)
ALTER TABLE events ADD COLUMN IF NOT EXISTS abgeschlossen BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_events_abgeschlossen ON events (abgeschlossen);
