CREATE TABLE IF NOT EXISTS group_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT group_appointments_time_check CHECK (end_time > start_time),
  CONSTRAINT group_appointments_duration_check CHECK (duration_minutes > 0),
  CONSTRAINT group_appointments_participants_check CHECK (max_participants > 0)
);

CREATE TABLE IF NOT EXISTS group_appointment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_appointment_id UUID NOT NULL REFERENCES group_appointments(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  calendar_id UUID REFERENCES calendars(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_appointment_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_appointment_id UUID NOT NULL REFERENCES group_appointments(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'invited',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_appointments_tenant ON group_appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_group_appointments_time ON group_appointments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_group_appointments_status ON group_appointments(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_appointment_provider_unique
  ON group_appointment_providers(group_appointment_id, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_group_appointment_providers_status ON group_appointment_providers(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_appointment_participant_unique
  ON group_appointment_participants(group_appointment_id, participant_user_id);

CREATE INDEX IF NOT EXISTS idx_group_appointment_participants_status
  ON group_appointment_participants(status);

CREATE TRIGGER set_group_appointments_updated_at
  BEFORE UPDATE ON group_appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_group_appointment_providers_updated_at
  BEFORE UPDATE ON group_appointment_providers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_group_appointment_participants_updated_at
  BEFORE UPDATE ON group_appointment_participants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();
