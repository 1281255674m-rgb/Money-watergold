PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  wechat_encrypted TEXT NOT NULL,
  phone_encrypted TEXT NOT NULL DEFAULT '',
  wechat_hash TEXT NOT NULL,
  interests_json TEXT NOT NULL,
  ideas TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'direct',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'not_suitable')),
  agent_code TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  duplicate_suspected INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_suspected IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_wechat_hash ON applications(wechat_hash);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_agent_code ON applications(agent_code) WHERE agent_code <> '';

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'direct',
  session_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(name);

CREATE TABLE IF NOT EXISTS submission_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_fingerprint_time ON submission_rate_limits(fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON submission_rate_limits(created_at);

CREATE TABLE IF NOT EXISTS sequence_counters (
  counter_key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
