DROP INDEX IF EXISTS idx_waitlist_priority;
DROP INDEX IF EXISTS idx_waitlist_provider;
DROP INDEX IF EXISTS idx_waitlist_status;
DROP INDEX IF EXISTS idx_waitlist_tenant;
DROP TRIGGER IF EXISTS set_waitlist_entries_updated_at ON waitlist_entries;
DROP TABLE IF EXISTS waitlist_entries;
DROP TYPE IF EXISTS waitlist_status;
DROP TYPE IF EXISTS waitlist_priority;
