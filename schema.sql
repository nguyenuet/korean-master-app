-- Korean Master – Cloudflare D1 schema
-- Run: npx wrangler d1 execute korean-learning-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
  username         TEXT PRIMARY KEY,
  pin              TEXT NOT NULL,           -- SHA-256 hash of username + 4-digit PIN
  streak           INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,                    -- YYYY-MM-DD
  xp               INTEGER NOT NULL DEFAULT 0,
  daily_goal       INTEGER NOT NULL DEFAULT 50,
  activity         TEXT NOT NULL DEFAULT '[]', -- JSON array of active dates
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS progress (
  username   TEXT NOT NULL,
  unit_id    TEXT NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (username, unit_id),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_username ON progress(username);
