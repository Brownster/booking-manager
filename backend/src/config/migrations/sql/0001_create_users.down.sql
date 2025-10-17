DROP TRIGGER IF EXISTS set_users_updated_at ON users;
DROP TRIGGER IF EXISTS set_tenants_updated_at ON tenants;
DROP FUNCTION IF EXISTS set_updated_at_timestamp;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;
