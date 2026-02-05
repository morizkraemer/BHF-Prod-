-- Produktionstool initial schema (hybrid: core columns + form_data JSONB)
-- Run in order via backend/migrate.js

-- Events (core columns + form payload as JSONB)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT,
  event_date DATE,
  doors_time TEXT,
  phase TEXT NOT NULL DEFAULT 'VVA' CHECK (phase IN ('VVA', 'SL', 'closed')),
  form_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_phase ON events (phase);
CREATE INDEX idx_events_event_date ON events (event_date);

-- Catalogs: rider items
CREATE TABLE rider_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  ek_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogs: night leads
CREATE TABLE night_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogs: person names (secu / tech / andere)
CREATE TABLE person_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('secu', 'tech', 'andere')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_person_names_type ON person_names (type);

-- Catalogs: bestückung lists (metadata)
CREATE TABLE bestueckung_lists (
  list_key TEXT PRIMARY KEY,
  total_price TEXT DEFAULT '',
  pricing_type TEXT DEFAULT 'pauschale'
);

-- Catalogs: bestückung list items (rider_item_id + amount per list)
CREATE TABLE bestueckung_list_items (
  list_key TEXT NOT NULL REFERENCES bestueckung_lists (list_key) ON DELETE CASCADE,
  rider_item_id UUID NOT NULL REFERENCES rider_items (id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 1,
  PRIMARY KEY (list_key, rider_item_id)
);

-- Catalogs: wage options
CREATE TABLE wage_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- Catalogs: person wages (key = trimmed name, value = wage option label)
CREATE TABLE person_wages (
  person_name_key TEXT PRIMARY KEY,
  wage_option_label TEXT NOT NULL
);

-- Settings (key-value JSONB)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'
);

-- Documents (file paths and metadata; files on disk)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('scan', 'report', 'section', 'einkaufsbeleg', 'zeiterfassung')),
  section_or_name TEXT,
  file_path TEXT NOT NULL,
  content_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_event_id ON documents (event_id);

-- Seed default bestückung list keys (match store defaults)
INSERT INTO bestueckung_lists (list_key, total_price, pricing_type)
VALUES ('standard-konzert', '', 'pauschale'), ('standard-tranzit', '', 'pauschale')
ON CONFLICT (list_key) DO NOTHING;
