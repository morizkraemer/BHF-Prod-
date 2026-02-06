-- Add category to rider_items (Karte | Extra)
ALTER TABLE rider_items
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Extra'
  CHECK (category IN ('Karte', 'Extra'));
