-- Replace wage_option_label with numeric hourly_wage; drop wage_options catalog.

-- roles: add hourly_wage, backfill from wage_option_label (parse number), drop wage_option_label
ALTER TABLE roles ADD COLUMN IF NOT EXISTS hourly_wage DECIMAL(10,2) DEFAULT 0 NOT NULL;
UPDATE roles
SET hourly_wage = COALESCE(
  NULLIF(
    trim(regexp_replace(regexp_replace(trim(COALESCE(wage_option_label, '')), '[^0-9,.]', '', 'g'), ',', '.', 'g')),
    ''
  )::DECIMAL(10,2),
  0
);
ALTER TABLE roles DROP COLUMN IF EXISTS wage_option_label;

-- person_wages: add hourly_wage, backfill, drop wage_option_label
ALTER TABLE person_wages ADD COLUMN IF NOT EXISTS hourly_wage DECIMAL(10,2) DEFAULT 0 NOT NULL;
UPDATE person_wages
SET hourly_wage = COALESCE(
  NULLIF(
    trim(regexp_replace(regexp_replace(trim(COALESCE(wage_option_label, '')), '[^0-9,.]', '', 'g'), ',', '.', 'g')),
    ''
  )::DECIMAL(10,2),
  0
);
ALTER TABLE person_wages DROP COLUMN IF EXISTS wage_option_label;

-- Remove wage options catalog
DROP TABLE IF EXISTS wage_options;
