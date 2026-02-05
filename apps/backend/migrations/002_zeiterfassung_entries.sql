-- Zeiterfassung time entries (hours/wages per person per event)
-- One row per person per role when close-shift runs

CREATE TABLE zeiterfassung_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('secu', 'ton_licht', 'andere')),
  event_name TEXT,
  entry_date DATE NOT NULL,
  person_name TEXT NOT NULL,
  wage NUMERIC NOT NULL DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  hours NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zeiterfassung_entries_event_id ON zeiterfassung_entries (event_id);
CREATE INDEX idx_zeiterfassung_entries_entry_date ON zeiterfassung_entries (entry_date);
