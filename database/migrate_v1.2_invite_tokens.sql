-- Femantic Migration: v1.1 → v1.2
-- Hierarchical roles (admin/pro/client) + Invite Tokens
-- Safe to run multiple times (idempotent)

BEGIN;

-- 1. Add new columns to users (if missing)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);

-- 2. Migrate old role values: 'user' → 'pro'
UPDATE users SET role = 'pro' WHERE role = 'user';

-- 3. Drop old role CHECK constraint and add new one
-- (constraint name may vary; try common patterns)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'pro', 'client'));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Invite Tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allowed_website_ids JSONB DEFAULT '[]',
    allowed_metrics JSONB DEFAULT '["visitors", "pageviews", "utm"]',
    label VARCHAR(255),
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_by ON invite_tokens(created_by);

-- 6. Client → Website access mapping
CREATE TABLE IF NOT EXISTS client_website_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    allowed_metrics JSONB DEFAULT '["visitors", "pageviews", "utm"]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, website_id)
);

CREATE INDEX IF NOT EXISTS idx_client_access_user ON client_website_access(user_id);
CREATE INDEX IF NOT EXISTS idx_client_access_website ON client_website_access(website_id);

COMMIT;

-- Verify
SELECT 'Migration complete' AS status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('parent_id', 'brand_name', 'role')
ORDER BY column_name;
