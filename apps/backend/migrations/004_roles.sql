-- User-defined roles (name + wage). person_wages stays as custom wage overrides.
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  wage_option_label TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0
);

-- Zeiterfassung entries store role name (from roles table). Drop fixed CHECK.
ALTER TABLE zeiterfassung_entries DROP CONSTRAINT IF EXISTS zeiterfassung_entries_role_check;

-- Backfill existing rows to role names (for display/consistency)
UPDATE zeiterfassung_entries SET role = 'Secu' WHERE role = 'secu';
UPDATE zeiterfassung_entries SET role = 'Ton/Licht' WHERE role = 'ton_licht';
UPDATE zeiterfassung_entries SET role = 'Andere Mitarbeiter' WHERE role = 'andere';

-- Seed default roles
INSERT INTO roles (name, wage_option_label, sort_order)
VALUES ('Secu', '', 0), ('Ton/Licht', '', 1), ('Andere Mitarbeiter', '', 2)
ON CONFLICT (name) DO NOTHING;
