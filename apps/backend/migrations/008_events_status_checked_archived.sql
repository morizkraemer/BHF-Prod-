-- Extend events.status to allow 'checked' and 'archived'.
-- Drop existing check and add new one (PostgreSQL does not allow altering CHECK in place).

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('open', 'closed', 'checked', 'finished', 'archived'));
