CREATE TABLE IF NOT EXISTS reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID        REFERENCES users(id) ON DELETE CASCADE,
  reported_id  UUID        REFERENCES users(id) ON DELETE CASCADE,
  session_id   UUID        REFERENCES sessions(id) ON DELETE SET NULL,
  reason       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);