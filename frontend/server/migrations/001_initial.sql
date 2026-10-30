CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'osa')),
  student_number text,
  program text,
  site text,
  sites text[] NOT NULL DEFAULT '{}',
  email_verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  actor_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'osa', 'guest')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS sessions_actor_id_idx ON sessions (actor_id);

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email', 'password_reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_tokens_user_purpose_idx
  ON email_tokens (user_id, purpose, expires_at);

CREATE TABLE IF NOT EXISTS guest_track_tokens (
  token_hash text PRIMARY KEY,
  guest_id text NOT NULL,
  report_id text NOT NULL,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY,
  reporter_id text NOT NULL,
  site text NOT NULL,
  moderation text NOT NULL,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports (reporter_id);
CREATE INDEX IF NOT EXISTS reports_discovery_idx
  ON reports (moderation, outcome, expires_at, site);

CREATE TABLE IF NOT EXISTS claims (
  id text PRIMARY KEY,
  report_id text NOT NULL REFERENCES reports(id),
  claimant_id text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS claims_report_id_idx ON claims (report_id);
CREATE INDEX IF NOT EXISTS claims_claimant_id_idx ON claims (claimant_id);

CREATE TABLE IF NOT EXISTS receipts (
  id text PRIMARY KEY,
  report_id text NOT NULL REFERENCES reports(id),
  created_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS releases (
  id text PRIMARY KEY,
  report_id text NOT NULL REFERENCES reports(id),
  created_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  report_id text NOT NULL REFERENCES reports(id),
  created_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  recipient_id text NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  created_at timestamptz NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON notifications (recipient_id, is_read, created_at DESC);
