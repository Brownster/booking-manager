CREATE OR REPLACE FUNCTION seed_tenant_roles(target_tenant_id UUID)
RETURNS void AS $$
DECLARE
  owner_role_id UUID;
  admin_role_id UUID;
  provider_role_id UUID;
  client_role_id UUID;
  support_role_id UUID;
BEGIN
  INSERT INTO roles (tenant_id, name, description, is_system)
  VALUES (target_tenant_id, 'owner', 'Full access to all tenant resources', true)
  RETURNING id INTO owner_role_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT owner_role_id, id FROM permissions;

  INSERT INTO roles (tenant_id, name, description, is_system)
  VALUES (target_tenant_id, 'admin', 'Manage team, appointments, waitlist, and roles', true)
  RETURNING id INTO admin_role_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_role_id, id
  FROM permissions
  WHERE name IN (
    'appointments:create', 'appointments:read', 'appointments:update', 'appointments:delete', 'appointments:read:all', 'appointments:manage',
    'calendars:create', 'calendars:read', 'calendars:update', 'calendars:delete', 'calendars:read:all',
    'availability:create', 'availability:read', 'availability:update', 'availability:delete',
    'waitlist:create', 'waitlist:read', 'waitlist:manage',
    'roles:create', 'roles:read', 'roles:update', 'roles:assign',
    'notifications:send', 'notifications:manage',
    'audit:read', 'metrics:read'
  );

  INSERT INTO roles (tenant_id, name, description, is_system)
  VALUES (target_tenant_id, 'provider', 'Manage own calendar, availability, and appointments', true)
  RETURNING id INTO provider_role_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT provider_role_id, id
  FROM permissions
  WHERE name IN (
    'appointments:create', 'appointments:read', 'appointments:update',
    'availability:create', 'availability:read', 'availability:update',
    'waitlist:read'
  );

  INSERT INTO roles (tenant_id, name, description, is_system)
  VALUES (target_tenant_id, 'client', 'Book and manage personal appointments', true)
  RETURNING id INTO client_role_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT client_role_id, id
  FROM permissions
  WHERE name IN ('appointments:create', 'appointments:read', 'waitlist:create', 'waitlist:read');

  INSERT INTO roles (tenant_id, name, description, is_system)
  VALUES (target_tenant_id, 'support', 'Assist clients and manage waitlist', true)
  RETURNING id INTO support_role_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT support_role_id, id
  FROM permissions
  WHERE name IN (
    'appointments:read', 'appointments:update',
    'waitlist:read', 'waitlist:manage',
    'notifications:send'
  );
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tenant RECORD;
BEGIN
  FOR tenant IN SELECT id FROM tenants LOOP
    PERFORM seed_tenant_roles(tenant.id);
  END LOOP;
END;
$$;
