DO $$ BEGIN
  CREATE TYPE mood_type AS ENUM ('casual_chat', 'study', 'networking');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  user2_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  room_id     TEXT        NOT NULL,
  mood        mood_type,
  is_saved    BOOLEAN     NOT NULL DEFAULT FALSE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  duration_s  INT,
  status      TEXT        NOT NULL DEFAULT 'active'
);