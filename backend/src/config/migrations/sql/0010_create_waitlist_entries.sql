CREATE TYPE waitlist_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE waitlist_status AS ENUM ('active', 'promoted', 'cancelled');

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  priority waitlist_priority NOT NULL DEFAULT 'medium',
  status waitlist_status NOT NULL DEFAULT 'active',
  requested_start TIMESTAMPTZ,
  requested_end TIMESTAMPTZ,
  auto_promote BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  metadata JSONB,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT waitlist_time_window CHECK (
    requested_start IS NULL OR requested_end IS NULL OR requested_end > requested_start
  )
);

CREATE TRIGGER set_waitlist_entries_updated_at
BEFORE UPDATE ON waitlist_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_waitlist_tenant ON waitlist_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_provider ON waitlist_entries(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist_entries(priority);
