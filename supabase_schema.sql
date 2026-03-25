-- ============================================================
-- AGENCY WORKFLOW — Supabase schema
-- Spusť celý tento soubor v Supabase → SQL Editor → New query
-- ============================================================

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  company     TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  client_id    TEXT REFERENCES clients(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  type         TEXT DEFAULT 'text',
  audio_url    TEXT,
  audio_name   TEXT,
  status       TEXT DEFAULT 'new',
  content_type TEXT DEFAULT 'other',
  deadline     TEXT,
  note         TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- OUTPUTS
CREATE TABLE IF NOT EXISTS outputs (
  id         TEXT PRIMARY KEY,
  task_id    TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  note       TEXT DEFAULT '',
  file_url   TEXT,
  file_name  TEXT,
  file_type  TEXT,
  url        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INQUIRIES
CREATE TABLE IF NOT EXISTS inquiries (
  id            TEXT PRIMARY KEY,
  client_name   TEXT NOT NULL,
  contact       TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  budget        TEXT DEFAULT '',
  content_types JSONB DEFAULT '[]',
  deadline      TEXT DEFAULT '',
  source        TEXT DEFAULT '',
  votes         JSONB DEFAULT '{"member1": null, "member2": null}',
  notes         TEXT DEFAULT '',
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- INSPIRATION
CREATE TABLE IF NOT EXISTS inspiration (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  type        TEXT DEFAULT 'other',
  tags        JSONB DEFAULT '[]',
  file_url    TEXT,
  file_name   TEXT,
  file_type   TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS (jeden řádek)
CREATE TABLE IF NOT EXISTS settings (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  member1_name TEXT DEFAULT 'Člen 1',
  member2_name TEXT DEFAULT 'Člen 2'
);
INSERT INTO settings (id, member1_name, member2_name)
VALUES (1, 'Člen 1', 'Člen 2')
ON CONFLICT (id) DO NOTHING;

-- ── RLS POLICIES (povol přístup bez přihlášení) ──────────────────────────────

ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_clients"     ON clients     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks"       ON tasks       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_outputs"     ON outputs     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_inquiries"   ON inquiries   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_inspiration" ON inspiration FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings"    ON settings    FOR ALL TO anon USING (true) WITH CHECK (true);
