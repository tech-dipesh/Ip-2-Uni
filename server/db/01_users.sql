CREATE TABLE IF NOT EXISTS users (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username         VARCHAR(50)  UNIQUE NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    TEXT         NOT NULL,
  reputation_score INT          NOT NULL DEFAULT 100,
  is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);