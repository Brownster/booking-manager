CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity SMALLINT NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_slots_day_valid CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT availability_slots_time_order CHECK (end_time > start_time),
  CONSTRAINT availability_slots_capacity_valid CHECK (capacity >= 1)
);

CREATE INDEX IF NOT EXISTS idx_availability_calendar ON availability_slots(calendar_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON availability_slots(day_of_week);

CREATE TRIGGER set_availability_slots_updated_at
BEFORE UPDATE ON availability_slots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
