CREATE TABLE IF NOT EXISTS calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  timezone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT calendars_timezone_not_empty CHECK (timezone <> '')
);

CREATE INDEX IF NOT EXISTS idx_calendars_tenant ON calendars(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendars_provider ON calendars(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_active ON calendars(is_active) WHERE is_active = TRUE;

CREATE TRIGGER set_calendars_updated_at
BEFORE UPDATE ON calendars
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS calendar_skills (
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (calendar_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_skills_skill ON calendar_skills(skill_id);
