-- Seed core system permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('appointments:create', 'appointments', 'create', 'Create appointments'),
  ('appointments:read', 'appointments', 'read', 'View own appointments'),
  ('appointments:update', 'appointments', 'update', 'Modify appointments'),
  ('appointments:delete', 'appointments', 'delete', 'Cancel appointments'),
  ('appointments:read:all', 'appointments', 'read:all', 'View all tenant appointments'),
  ('appointments:manage', 'appointments', 'manage', 'Manage appointments for other users'),

  ('calendars:create', 'calendars', 'create', 'Create calendars'),
  ('calendars:read', 'calendars', 'read', 'View calendars'),
  ('calendars:update', 'calendars', 'update', 'Modify calendars'),
  ('calendars:delete', 'calendars', 'delete', 'Delete calendars'),
  ('calendars:read:all', 'calendars', 'read:all', 'View all tenant calendars'),

  ('skills:create', 'skills', 'create', 'Create skills'),
  ('skills:read', 'skills', 'read', 'View skills'),
  ('skills:update', 'skills', 'update', 'Modify skills'),
  ('skills:delete', 'skills', 'delete', 'Delete skills'),

  ('availability:create', 'availability', 'create', 'Create availability slots'),
  ('availability:read', 'availability', 'read', 'View availability slots'),
  ('availability:update', 'availability', 'update', 'Modify availability slots'),
  ('availability:delete', 'availability', 'delete', 'Delete availability slots'),

  ('users:create', 'users', 'create', 'Create users'),
  ('users:read', 'users', 'read', 'View users'),
  ('users:update', 'users', 'update', 'Modify users'),
  ('users:delete', 'users', 'delete', 'Delete users'),

  ('roles:create', 'roles', 'create', 'Create custom roles'),
  ('roles:read', 'roles', 'read', 'View roles'),
  ('roles:update', 'roles', 'update', 'Modify roles'),
  ('roles:delete', 'roles', 'delete', 'Delete roles'),
  ('roles:assign', 'roles', 'assign', 'Assign roles to users'),

  ('waitlist:create', 'waitlist', 'create', 'Create waitlist entries'),
  ('waitlist:read', 'waitlist', 'read', 'View waitlist entries'),
  ('waitlist:manage', 'waitlist', 'manage', 'Manage waitlist promotions'),

  ('groupAppointments:create', 'groupAppointments', 'create', 'Create group appointments'),
  ('groupAppointments:read', 'groupAppointments', 'read', 'View group appointments'),
  ('groupAppointments:update', 'groupAppointments', 'update', 'Modify group appointments'),
  ('groupAppointments:delete', 'groupAppointments', 'delete', 'Cancel group appointments'),

  ('notifications:send', 'notifications', 'send', 'Send notifications'),
  ('notifications:manage', 'notifications', 'manage', 'Manage notification settings'),

  ('audit:read', 'audit', 'read', 'View audit logs'),
  ('metrics:read', 'metrics', 'read', 'Access system metrics')
ON CONFLICT (name) DO NOTHING;
