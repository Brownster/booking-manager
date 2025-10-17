# Phase 2 Execution Plan — RBAC & Advanced Features
## ✅ TECHNICAL REVIEW - Approved with Recommendations

> Builds on Phase 1 foundations. Objectives: enterprise-grade role-based access control, advanced booking workflows, and operational observability while maintaining modular, DRY architecture and comprehensive automated testing.

**Review Summary:**
- **Overall Quality:** ⭐⭐⭐⭐⭐ Excellent - Well-structured, comprehensive, risk-aware
- **Scope Appropriateness:** ✅ Good - Ambitious but achievable in 4 weeks
- **Technical Soundness:** ✅ Solid architecture decisions
- **Risk Awareness:** ✅ Proactive - Good risk register
- **Recommendations:** See inline comments below

---

## 0. Pre-flight Checklist

**✅ GOOD:** Proper dependency validation before starting

1. **Dependencies**
   - Confirm Postgres migrations applied through Phase 1. ✅
   - Ensure Redis running for caching/token blacklist. ✅
   - Introduce any new libraries (e.g., access-control helpers) with threat modelling review.

   **💡 RECOMMENDATION:** Consider these libraries:
   - `accesscontrol` (npm) - Mature RBAC library with inheritance
   - `casbin` (npm) - More flexible policy engine, supports ABAC
   - **SUGGESTED:** Build custom lightweight RBAC (better control, no external deps for security-critical code)

2. **Environment Variables**
   - Add `RBAC_DEFAULT_ROLE`, `AUDIT_LOG_LEVEL`, `FEATURE_FLAG_*` to `.env.example`.
   - Provide test-specific overrides where needed.

   **💡 ADDITIONAL ENV VARS NEEDED:**
   ```bash
   # RBAC Configuration
   RBAC_DEFAULT_ROLE=client
   RBAC_CACHE_TTL=3600  # 1 hour
   RBAC_ENABLE_CACHING=true

   # Audit Configuration
   AUDIT_LOG_LEVEL=info
   AUDIT_BATCH_SIZE=100
   AUDIT_BATCH_INTERVAL=5000  # 5 seconds
   AUDIT_EXCLUDE_ENDPOINTS=/health,/metrics  # Don't audit health checks

   # Waitlist Configuration
   WAITLIST_MAX_SIZE=100
   WAITLIST_AUTO_PROMOTE=true
   WAITLIST_PROMOTION_DELAY=300  # 5 minutes to accept before next person

   # Group Booking Configuration
   GROUP_BOOKING_MAX_PARTICIPANTS=10
   GROUP_BOOKING_TIMEOUT=300000  # 5 minutes to confirm all participants

   # Feature Flags
   FEATURE_FLAG_GROUP_BOOKINGS=true
   FEATURE_FLAG_WAITLIST=true
   FEATURE_FLAG_NOTIFICATIONS=false  # Stub only in Phase 2
   ```

3. **Documentation Baseline**
   - Snapshot current API docs.
   - Update architectural diagram with RBAC module placements.

   **⚠️ CRITICAL:** Add to baseline:
   - Document **current performance metrics** (response times, query times) to compare against Phase 2 with RBAC overhead
   - Create **before/after API documentation** to track breaking changes
   - **Migration path document** for existing users/roles to new RBAC system

---

## 1. RBAC Core (Weeks 6-7)

**✅ EXCELLENT:** Well-thought-out RBAC design

### 1.1 Role & Permission Model

**📋 DETAILED FEEDBACK:**

- **Schema**
  - Tables: `roles`, `permissions`, `role_permissions`, `user_roles`.

  **💡 SCHEMA RECOMMENDATIONS:**

  ```sql
  -- 0007_create_rbac_tables.sql

  -- Permissions define what can be done (resource:action)
  CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,  -- e.g., "appointments:create", "calendars:read"
    resource VARCHAR(50) NOT NULL,       -- e.g., "appointments", "calendars"
    action VARCHAR(50) NOT NULL,         -- e.g., "create", "read", "update", "delete"
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT permissions_unique_resource_action UNIQUE (resource, action)
  );

  -- Roles are collections of permissions
  CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,  -- System roles can't be deleted
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT roles_unique_name_per_tenant UNIQUE (tenant_id, name)
  );

  -- Map permissions to roles (many-to-many)
  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
  );

  -- Users can have multiple roles (many-to-many)
  CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),  -- Who assigned this role?
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Optional: temporary role assignments
    PRIMARY KEY (user_id, role_id)
  );

  -- Indexes for performance
  CREATE INDEX idx_roles_tenant ON roles(tenant_id);
  CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
  CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
  CREATE INDEX idx_user_roles_user ON user_roles(user_id);
  CREATE INDEX idx_user_roles_role ON user_roles(role_id);
  CREATE INDEX idx_permissions_resource ON permissions(resource);

  -- Triggers
  CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();
  ```

  **⚠️ IMPORTANT ADDITIONS:**
  1. Add `is_system` flag to roles - prevents deletion of core roles
  2. Add `assigned_by` to user_roles - audit trail for who granted permissions
  3. Add `expires_at` to user_roles - support temporary role assignments
  4. Consider adding `priority` to roles for conflict resolution

  - Default roles: `owner`, `admin`, `provider`, `client`, `support`.

  **💡 SEED DATA NEEDED (0007_seed_rbac.sql):**

  ```sql
  -- Insert system permissions
  INSERT INTO permissions (name, resource, action, description) VALUES
    -- Appointment permissions
    ('appointments:create', 'appointments', 'create', 'Create appointments'),
    ('appointments:read', 'appointments', 'read', 'View appointments'),
    ('appointments:update', 'appointments', 'update', 'Modify appointments'),
    ('appointments:delete', 'appointments', 'delete', 'Cancel appointments'),
    ('appointments:read:all', 'appointments', 'read:all', 'View all tenant appointments'),

    -- Calendar permissions
    ('calendars:create', 'calendars', 'create', 'Create calendars'),
    ('calendars:read', 'calendars', 'read', 'View calendars'),
    ('calendars:update', 'calendars', 'update', 'Modify calendars'),
    ('calendars:delete', 'calendars', 'delete', 'Delete calendars'),
    ('calendars:read:all', 'calendars', 'read:all', 'View all tenant calendars'),

    -- Skill permissions
    ('skills:create', 'skills', 'create', 'Create skills'),
    ('skills:read', 'skills', 'read', 'View skills'),
    ('skills:update', 'skills', 'update', 'Modify skills'),
    ('skills:delete', 'skills', 'delete', 'Delete skills'),

    -- Availability permissions
    ('availability:create', 'availability', 'create', 'Create availability slots'),
    ('availability:read', 'availability', 'read', 'View availability'),
    ('availability:update', 'availability', 'update', 'Modify availability'),
    ('availability:delete', 'availability', 'delete', 'Delete availability'),

    -- User management permissions
    ('users:create', 'users', 'create', 'Create users'),
    ('users:read', 'users', 'read', 'View users'),
    ('users:update', 'users', 'update', 'Modify users'),
    ('users:delete', 'users', 'delete', 'Delete users'),

    -- Role management permissions
    ('roles:create', 'roles', 'create', 'Create custom roles'),
    ('roles:read', 'roles', 'read', 'View roles'),
    ('roles:update', 'roles', 'update', 'Modify roles'),
    ('roles:delete', 'roles', 'delete', 'Delete roles'),
    ('roles:assign', 'roles', 'assign', 'Assign roles to users'),

    -- Audit log permissions
    ('audit:read', 'audit', 'read', 'View audit logs'),

    -- Waitlist permissions
    ('waitlist:create', 'waitlist', 'create', 'Add to waitlist'),
    ('waitlist:read', 'waitlist', 'read', 'View waitlist'),
    ('waitlist:manage', 'waitlist', 'manage', 'Manage waitlist entries');

  -- Note: Default roles must be inserted per-tenant, not globally
  -- This should be done in backend/src/config/seeds/rbac-seed.js
  ```

  - Support tenant-level scoping (`tenant_id` columns, CASCADE deletes). ✅ GOOD

- **Repositories**
  - `role.repository.js`, `permission.repository.js`.

  **💡 ADDITIONAL REPOSITORIES NEEDED:**
  - `userRole.repository.js` - Managing user role assignments
  - `rolePermission.repository.js` - Managing role-permission mappings

  **📝 EXAMPLE IMPLEMENTATION:**

  ```javascript
  // backend/src/repositories/role.repository.js

  export const getRoleWithPermissions = async (tenantId, roleId) => {
    const { rows } = await query(
      `
      SELECT
        r.*,
        json_agg(json_build_object(
          'id', p.id,
          'name', p.name,
          'resource', p.resource,
          'action', p.action
        )) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.tenant_id = $1 AND r.id = $2
      GROUP BY r.id
      `,
      [tenantId, roleId]
    );
    return rows[0];
  };

  export const getUserRoles = async (userId) => {
    const { rows } = await query(
      `
      SELECT
        r.*,
        ur.assigned_at,
        ur.assigned_by,
        ur.expires_at
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      `,
      [userId]
    );
    return rows;
  };
  ```

- **Services**
  - `rbac.service.js` managing inheritance, permission lookup, caching.

  **💡 KEY METHODS NEEDED:**

  ```javascript
  // backend/src/services/rbac.service.js

  /**
   * Get all permissions for a user (with caching)
   * @returns {Promise<Set<string>>} Set of permission names
   */
  export const getUserPermissions = async (userId, tenantId);

  /**
   * Check if user has specific permission
   * @returns {Promise<boolean>}
   */
  export const userHasPermission = async (userId, tenantId, permission);

  /**
   * Check if user has ALL of the required permissions
   * @returns {Promise<boolean>}
   */
  export const userHasAllPermissions = async (userId, tenantId, permissions[]);

  /**
   * Check if user has ANY of the required permissions
   * @returns {Promise<boolean>}
   */
  export const userHasAnyPermission = async (userId, tenantId, permissions[]);

  /**
   * Invalidate permission cache for user
   */
  export const invalidateUserPermissions = async (userId, tenantId);

  /**
   * Assign role to user
   */
  export const assignRoleToUser = async (userId, roleId, assignedBy);

  /**
   * Remove role from user
   */
  export const removeRoleFromUser = async (userId, roleId);

  /**
   * Create custom role (tenant-specific)
   */
  export const createCustomRole = async (tenantId, name, permissionIds);
  ```

- **Caching**
  - Redis namespace `rbac:tenant:{id}:user:{id}` for resolved permissions with TTL + invalidation hooks.

  **✅ EXCELLENT:** Good cache key design

  **💡 CACHE STRATEGY RECOMMENDATIONS:**

  ```javascript
  // Cache structure
  const cacheKey = `rbac:tenant:${tenantId}:user:${userId}`;
  const ttl = 3600; // 1 hour

  // Cache value format (JSON)
  {
    permissions: ["appointments:create", "calendars:read", ...],
    roles: ["provider", "admin"],
    cachedAt: "2025-10-16T02:00:00Z",
    expiresAt: "2025-10-16T03:00:00Z"
  }

  // Invalidation triggers:
  // 1. User role assignment/removal
  // 2. Role permission changes
  // 3. Role deletion
  // 4. Manual cache clear (admin action)

  // Consider: Cache warming on login to avoid cold start latency
  ```

  **⚠️ CACHE INVALIDATION STRATEGY:**
  - When role permissions change, invalidate ALL users with that role
  - Consider using Redis Sets to track `role:{roleId}:users` for batch invalidation
  - Add cache hit/miss metrics to monitor effectiveness

### 1.2 Policy Enforcement Layer

**✅ GOOD:** Middleware-based approach is correct

- **Middleware**
  - `authorizePermissions(requiredPermissions)` checking cached/resolved set.

  **📝 IMPLEMENTATION EXAMPLE:**

  ```javascript
  // backend/src/middleware/rbac.middleware.js

  export const requirePermissions = (requiredPermissions, options = {}) => {
    const { mode = 'all' } = options; // 'all' or 'any'

    return async (req, res, next) => {
      try {
        // req.user populated by auth.middleware
        const { id: userId, tenantId } = req.user;

        const hasPermission = mode === 'all'
          ? await rbacService.userHasAllPermissions(userId, tenantId, requiredPermissions)
          : await rbacService.userHasAnyPermission(userId, tenantId, requiredPermissions);

        if (!hasPermission) {
          throw new ApiError(403, 'Insufficient permissions', {
            required: requiredPermissions,
            mode
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  // Usage in routes:
  router.post(
    '/appointments',
    authenticate,
    requirePermissions(['appointments:create']),
    createAppointmentValidation,
    appointmentController.create
  );
  ```

  **💡 ADDITIONAL MIDDLEWARE NEEDED:**

  ```javascript
  /**
   * Check if user can perform action on specific resource
   * Combines permission check + ownership check
   */
  export const requireResourcePermission = (permission, resourceType) => {
    return async (req, res, next) => {
      // 1. Check if user has the permission
      // 2. If permission includes ":own", verify ownership
      // 3. If permission includes ":all", allow access
    };
  };
  ```

  - `ownershipGuard` factory verifying resource ownership (calendar, appointment).

  **📝 IMPLEMENTATION EXAMPLE:**

  ```javascript
  /**
   * Verify user owns the resource or has :all permission
   * @param {string} resourceType - 'calendar', 'appointment', etc.
   * @param {string} paramName - Parameter name in req.params (default: 'id')
   */
  export const requireOwnership = (resourceType, options = {}) => {
    const { paramName = 'id', allowPermission } = options;

    return async (req, res, next) => {
      try {
        const resourceId = req.params[paramName];
        const { id: userId, tenantId } = req.user;

        // If user has :all permission, bypass ownership check
        if (allowPermission) {
          const hasAllPermission = await rbacService.userHasPermission(
            userId,
            tenantId,
            `${resourceType}:read:all`
          );
          if (hasAllPermission) {
            return next();
          }
        }

        // Check ownership
        const repository = getRepository(resourceType);
        const resource = await repository.findById(tenantId, resourceId);

        if (!resource) {
          throw new ApiError(404, `${resourceType} not found`);
        }

        // Check if user owns this resource
        const ownerField = getOwnerField(resourceType); // e.g., 'provider_user_id'
        if (resource[ownerField] !== userId && resource.created_by !== userId) {
          throw new ApiError(403, 'You do not own this resource');
        }

        // Attach resource to request for reuse in controller
        req[resourceType] = resource;
        next();
      } catch (error) {
        next(error);
      }
    };
  };

  // Usage:
  router.put(
    '/calendars/:id',
    authenticate,
    requirePermissions(['calendars:update']),
    requireOwnership('calendar', { allowPermission: 'calendars:update:all' }),
    updateCalendarValidation,
    calendarController.update
  );
  ```

- **Integration**
  - Wrap existing routes (skills, calendars, availability, appointments) with permission checks.

  **⚠️ CRITICAL: MIGRATION PATH**

  Existing routes use simple role checks:
  ```javascript
  // Current (Phase 1):
  router.post('/skills', requireRole(['admin']), createSkill);

  // Phase 2:
  router.post('/skills', requirePermissions(['skills:create']), createSkill);
  ```

  **💡 MIGRATION STRATEGY:**
  1. Keep both middlewares during transition
  2. Default role-to-permission mapping for backward compatibility
  3. Deprecate `requireRole` in favor of `requirePermissions`
  4. Document breaking changes in CHANGELOG.md

  **📋 PERMISSION MAPPING TABLE:**

  | Phase 1 Role Check | Phase 2 Permission | Notes |
  |--------------------|-------------------|-------|
  | `requireRole(['admin'])` | `requirePermissions(['skills:create'])` | Admin role gets all permissions |
  | `requireRole(['provider'])` | `requirePermissions(['calendars:create'])` | Provider can manage their own calendars |
  | `requireRole(['user'])` | `requirePermissions(['appointments:create'])` | All authenticated users can book |

  - Expose `GET /api/v1/rbac/permissions` for introspection (admin-only).

  **✅ EXCELLENT IDEA:** Frontend needs this for dynamic UI

  **📝 ADDITIONAL ENDPOINTS NEEDED:**

  ```javascript
  // GET /api/v1/rbac/me/permissions - Get current user's permissions
  // GET /api/v1/rbac/roles - List all roles in tenant
  // GET /api/v1/rbac/roles/:id - Get role details with permissions
  // POST /api/v1/rbac/roles - Create custom role (admin)
  // PUT /api/v1/rbac/roles/:id - Update role permissions (admin)
  // DELETE /api/v1/rbac/roles/:id - Delete role (admin, non-system only)
  // GET /api/v1/rbac/users/:id/roles - Get user's roles (admin or self)
  // POST /api/v1/rbac/users/:id/roles - Assign role to user (admin)
  // DELETE /api/v1/rbac/users/:id/roles/:roleId - Remove role from user (admin)
  ```

### 1.3 Testing

**✅ GOOD:** Comprehensive test coverage planned

- **Unit**
  - Permission resolution, inheritance, cache invalidation.

  **💡 ADDITIONAL TEST CASES:**
  - Expired role assignments (test `expires_at` logic)
  - Permission priority/conflict resolution
  - Cache TTL expiration
  - Cache hit/miss scenarios
  - Permission string parsing (`resource:action` validation)

- **Integration**
  - Route-level enforcement scenarios (allowed/denied).
  - Tenant boundary tests.

  **💡 CRITICAL TEST SCENARIOS:**
  ```javascript
  describe('RBAC Integration', () => {
    it('denies access without required permission', async () => {
      // User with 'client' role tries to create skill
      // Should receive 403 Forbidden
    });

    it('allows access with correct permission', async () => {
      // User with 'admin' role creates skill
      // Should succeed
    });

    it('enforces tenant boundary', async () => {
      // User from tenant A tries to access resource from tenant B
      // Even with correct permission, should be denied
    });

    it('respects ownership guards', async () => {
      // Provider tries to update another provider's calendar
      // Should be denied unless has :all permission
    });

    it('caches permissions correctly', async () => {
      // First request: cache miss (query DB)
      // Second request: cache hit (no DB query)
      // After role change: cache invalidated
    });

    it('handles role expiration', async () => {
      // User with expired role assignment
      // Should not have those role's permissions
    });
  });
  ```

- **Security Tests**
  - Attempt privilege escalation (e.g., provider creating admin role).

  **⚠️ CRITICAL SECURITY TESTS:**

  ```javascript
  describe('RBAC Security', () => {
    it('prevents privilege escalation via role assignment', async () => {
      // Provider tries to assign 'admin' role to themselves
      // Should be denied
    });

    it('prevents modification of system roles', async () => {
      // Admin tries to delete 'owner' system role
      // Should be denied
    });

    it('prevents cross-tenant role assignment', async () => {
      // Admin from tenant A tries to assign role to user in tenant B
      // Should be denied
    });

    it('prevents granting higher permissions than own', async () => {
      // Admin tries to create role with permissions they don't have
      // Should be denied
    });

    it('prevents permission bypass via cache poisoning', async () => {
      // Attempt to manipulate Redis cache keys
      // Should fail gracefully
    });
  });
  ```

  **💡 ADDITIONAL RECOMMENDATION:**
  - Add **penetration testing** to Phase 2 scope
  - Document RBAC security model in `docs/security/rbac-security-model.md`
  - Create threat model diagram showing attack surfaces

---

## 2. Advanced Booking Workflows (Weeks 7-8)

**✅ AMBITIOUS:** This is a lot of functionality for 2 weeks

**⚠️ SCOPE CONCERN:** Group bookings, waitlist, and notifications are each complex features. Consider:
- **Option A:** Implement group bookings + waitlist fully, leave notifications as stub (as planned)
- **Option B:** Implement group bookings fully, make waitlist + notifications Phase 3
- **Recommendation:** Follow Option A, but be prepared to descope if timeline slips

### 2.1 Group & Multi-Provider Scheduling

**✅ GOOD:** Clear scope

- **Schema**
  - `group_appointments` table linking multiple calendars/users.
  - `appointment_participants` join table.

  **💡 DETAILED SCHEMA:**

  ```sql
  -- 0008_create_group_appointments.sql

  CREATE TABLE IF NOT EXISTS group_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200),  -- Optional: "Team Meeting", "Workshop", etc.
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, confirmed, cancelled
    min_participants INTEGER DEFAULT 1,  -- Minimum required to proceed
    max_participants INTEGER NOT NULL,   -- Maximum allowed
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,  -- When all participants confirmed
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT group_appointments_times_valid CHECK (start_time < end_time),
    CONSTRAINT group_appointments_participants_valid CHECK (min_participants <= max_participants)
  );

  CREATE TABLE IF NOT EXISTS group_appointment_participants (
    group_appointment_id UUID NOT NULL REFERENCES group_appointments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- 'provider', 'client', 'organizer'
    calendar_id UUID REFERENCES calendars(id),  -- For providers
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, confirmed, declined
    confirmed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    notes TEXT,
    PRIMARY KEY (group_appointment_id, user_id)
  );

  -- Indexes
  CREATE INDEX idx_group_appointments_tenant ON group_appointments(tenant_id);
  CREATE INDEX idx_group_appointments_status ON group_appointments(status);
  CREATE INDEX idx_group_appointments_start_time ON group_appointments(start_time);
  CREATE INDEX idx_group_appointment_participants_user ON group_appointment_participants(user_id);
  CREATE INDEX idx_group_appointment_participants_group ON group_appointment_participants(group_appointment_id);
  CREATE INDEX idx_group_appointment_participants_status ON group_appointment_participants(status);

  -- Triggers
  CREATE TRIGGER set_group_appointments_updated_at
  BEFORE UPDATE ON group_appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();
  ```

  **💡 ALTERNATIVE DESIGN CONSIDERATION:**
  Instead of separate `group_appointments` table, consider:
  - Add `group_appointment_id` to existing `appointments` table
  - One appointment = one participant, linked by `group_appointment_id`
  - **Pros:** Simpler, reuses existing conflict detection logic
  - **Cons:** More complex queries for group operations
  - **Recommendation:** Use separate table as planned (cleaner separation)

- **Services**
  - `groupBooking.service.js` orchestrating slot aggregation + capacity checks.

  **💡 KEY METHODS NEEDED:**

  ```javascript
  /**
   * Find available time slots for group booking
   * Must check availability across ALL required participants
   *
   * @param {Object} params
   * @param {string[]} params.providerUserIds - Required provider IDs
   * @param {Date} params.start - Search start date
   * @param {Date} params.end - Search end date
   * @param {number} params.duration - Duration in minutes
   * @param {string[]} params.skillIds - Required skills (ALL participants must have)
   * @returns {Array<{start, end, availableProviders}>}
   */
  export const findGroupAvailability = async (params);

  /**
   * Create group appointment (atomic operation)
   * Creates group appointment + all participant records in transaction
   *
   * @returns {Object} Group appointment with participants
   */
  export const createGroupAppointment = async (params);

  /**
   * Participant confirms/declines group appointment
   * Auto-confirms entire group if all confirmed
   * Auto-cancels if critical participant declines
   */
  export const updateParticipantStatus = async (groupId, userId, status);

  /**
   * Cancel group appointment
   * Notifies all participants
   */
  export const cancelGroupAppointment = async (groupId, reason);
  ```

  **⚠️ COMPLEX LOGIC WARNING:**

  Group availability search is **significantly more complex** than single-provider search:

  ```javascript
  // Pseudocode for group availability algorithm
  function findGroupAvailability(providers, start, end, duration) {
    // 1. Get availability slots for EACH provider
    const allProviderSlots = await Promise.all(
      providers.map(p => getProviderAvailability(p, start, end))
    );

    // 2. Find INTERSECTION of available times (when ALL are available)
    const commonSlots = findTimeIntersections(allProviderSlots, duration);

    // 3. Check for conflicts with existing appointments for ALL providers
    const conflicts = await getConflictsForProviders(providers, commonSlots);

    // 4. Filter out slots with conflicts
    const availableSlots = removeConflictingSlots(commonSlots, conflicts);

    return availableSlots;
  }
  ```

  **💡 PERFORMANCE OPTIMIZATION:**
  - This query could be SLOW with many providers
  - Consider limiting to max 3-5 providers for Phase 2
  - Use database-side intersection queries instead of application logic
  - Cache heavily (group availability changes less frequently)

- **API**
  - `POST /api/v1/appointments/group` with participant list, fallback to individual bookings on failure.

  **📝 API DESIGN:**

  ```javascript
  // POST /api/v1/appointments/group
  {
    "name": "Team Workshop",
    "description": "Quarterly planning session",
    "providerUserIds": ["uuid1", "uuid2", "uuid3"],  // Required providers
    "clientUserIds": ["uuid4", "uuid5"],              // Participants (optional)
    "startTime": "2025-11-01T10:00:00Z",
    "endTime": "2025-11-01T12:00:00Z",
    "minParticipants": 3,    // Minimum to proceed
    "maxParticipants": 10,   // Maximum allowed
    "skillIds": ["uuid-skill"],  // Required skills
    "autoConfirm": false,    // If true, auto-confirm when all accept
    "confirmationDeadline": "2025-10-30T23:59:59Z"  // Deadline for participants to confirm
  }

  // Response:
  {
    "groupAppointment": {
      "id": "uuid",
      "status": "pending",
      "participants": [
        {
          "userId": "uuid1",
          "role": "provider",
          "status": "pending",
          "confirmUrl": "/api/v1/appointments/group/{id}/confirm?token=..."
        }
      ],
      "confirmationDeadline": "...",
      "createdAt": "..."
    }
  }
  ```

  **💡 ADDITIONAL ENDPOINTS:**
  ```javascript
  // GET /api/v1/appointments/group/availability - Search group availability
  // GET /api/v1/appointments/group/:id - Get group appointment details
  // PUT /api/v1/appointments/group/:id - Update group appointment
  // POST /api/v1/appointments/group/:id/confirm - Participant confirms
  // POST /api/v1/appointments/group/:id/decline - Participant declines
  // DELETE /api/v1/appointments/group/:id - Cancel group appointment
  // GET /api/v1/appointments/group - List user's group appointments
  ```

  **⚠️ FALLBACK TO INDIVIDUAL BOOKINGS:**
  This is mentioned but not detailed. Consider:
  - What triggers fallback? (Timeout? Partial confirmation?)
  - Who decides which participants get individual bookings?
  - How to handle partial success? (2 of 3 providers confirmed)
  - **Recommendation:** Remove this feature from Phase 2, add in Phase 3

- **Validation**
  - Ensure all participants share tenant + relevant skills.

  **💡 ADDITIONAL VALIDATIONS:**
  - All provider user IDs must be valid and active
  - All providers must have calendars with required skills
  - Start/end times must be in future
  - Duration must not exceed calendar limits
  - Max participants must not exceed system limit
  - Time slot must be available for ALL providers

- - Enforce max group size (configurable).

  **✅ GOOD:** Make this configurable via env var `GROUP_BOOKING_MAX_PARTICIPANTS`

### 2.2 Waitlist & Auto-Reassignment

**✅ EXCELLENT FEATURE:** High business value

- **Schema Additions**
  - `waitlist_entries` table with status, priority, desired time window.

  **💡 DETAILED SCHEMA:**

  ```sql
  -- 0009_create_waitlist.sql

  CREATE TABLE IF NOT EXISTS waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,

    -- Time preferences
    preferred_start TIMESTAMPTZ NOT NULL,  -- Earliest desired time
    preferred_end TIMESTAMPTZ NOT NULL,    -- Latest desired time
    duration INTEGER NOT NULL,             -- Duration in minutes
    flexible BOOLEAN DEFAULT true,         -- Accept any time in window?

    -- Metadata
    priority INTEGER DEFAULT 0,            -- Higher = more priority
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, promoted, expired, cancelled
    notes TEXT,

    -- Auto-promotion settings
    auto_book BOOLEAN DEFAULT true,        -- Auto-book when slot available?
    notified_at TIMESTAMPTZ,               -- When user was notified
    expires_at TIMESTAMPTZ,                -- Entry expiration

    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    promoted_at TIMESTAMPTZ,               -- When promoted to appointment
    appointment_id UUID REFERENCES appointments(id),  -- Resulting appointment

    CONSTRAINT waitlist_entries_times_valid CHECK (preferred_start < preferred_end),
    CONSTRAINT waitlist_entries_duration_valid CHECK (duration > 0)
  );

  -- Indexes
  CREATE INDEX idx_waitlist_entries_tenant ON waitlist_entries(tenant_id);
  CREATE INDEX idx_waitlist_entries_user ON waitlist_entries(user_id);
  CREATE INDEX idx_waitlist_entries_calendar ON waitlist_entries(calendar_id);
  CREATE INDEX idx_waitlist_entries_status ON waitlist_entries(status);
  CREATE INDEX idx_waitlist_entries_priority ON waitlist_entries(priority DESC);
  CREATE INDEX idx_waitlist_entries_time_window ON waitlist_entries(preferred_start, preferred_end);
  CREATE INDEX idx_waitlist_entries_expires ON waitlist_entries(expires_at) WHERE status = 'active';

  -- Composite index for promotion queries (most important)
  CREATE INDEX idx_waitlist_promotion
    ON waitlist_entries(calendar_id, status, priority DESC, created_at)
    WHERE status = 'active' AND auto_book = true;

  -- Triggers
  CREATE TRIGGER set_waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();
  ```

  **💡 PRIORITY LOGIC:**
  Consider these factors for priority calculation:
  - Base priority (user-defined or role-based)
  - Time on waitlist (FIFO bonus)
  - VIP/loyalty status
  - Number of previous cancellations
  - Flexibility (more flexible = higher priority)

- **Services**
  - `waitlist.service.js` hooking into appointment cancellation events.

  **💡 KEY METHODS:**

  ```javascript
  /**
   * Add user to waitlist
   */
  export const addToWaitlist = async (params);

  /**
   * Get user's waitlist entries
   */
  export const getUserWaitlistEntries = async (userId, tenantId);

  /**
   * Cancel waitlist entry
   */
  export const cancelWaitlistEntry = async (entryId, userId);

  /**
   * Process waitlist when slot becomes available
   * Called when appointment is cancelled or availability added
   */
  export const processWaitlist = async (calendarId, timeWindow);

  /**
   * Auto-promote waitlist entries to appointments
   * Uses advisory locks to prevent race conditions
   */
  export const promoteWaitlistEntries = async (calendarId);

  /**
   * Expire old waitlist entries
   * Run as cron job
   */
  export const expireWaitlistEntries = async ();
  ```

  - Enqueue logic when no slots available; auto-book when slots open.

  **⚠️ RACE CONDITION WARNING:**

  Multiple waitlist entries could try to claim the same slot simultaneously. Use **Postgres advisory locks**:

  ```javascript
  export const promoteWaitlistEntries = async (calendarId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Acquire advisory lock on calendar
      await client.query('SELECT pg_advisory_xact_lock($1)', [hashCalendarId(calendarId)]);

      // Find available slot
      const slot = await findNextAvailableSlot(client, calendarId);
      if (!slot) return null;

      // Find highest priority waitlist entry matching this slot
      const entry = await client.query(
        `
        SELECT * FROM waitlist_entries
        WHERE calendar_id = $1
          AND status = 'active'
          AND auto_book = true
          AND preferred_start <= $2
          AND preferred_end >= $3
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED  -- Skip if another transaction has it
        `,
        [calendarId, slot.end, slot.start]
      );

      if (!entry.rows[0]) return null;

      // Create appointment
      const appointment = await createAppointment(client, {
        calendarId,
        clientUserId: entry.rows[0].user_id,
        startTime: slot.start,
        endTime: slot.end
      });

      // Update waitlist entry
      await client.query(
        `UPDATE waitlist_entries
         SET status = 'promoted',
             promoted_at = NOW(),
             appointment_id = $1
         WHERE id = $2`,
        [appointment.id, entry.rows[0].id]
      );

      await client.query('COMMIT');

      // Send notification (outside transaction)
      await notificationService.send({
        userId: entry.rows[0].user_id,
        type: 'waitlist_promoted',
        data: { appointment }
      });

      return { entry: entry.rows[0], appointment };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };
  ```

  **💡 ALTERNATIVE: Use message queue (Phase 3)**
  - Push `appointment.cancelled` events to Redis/SQS
  - Worker processes waitlist promotion asynchronously
  - Better scalability, more complex setup

- **Event System**
  - Introduce lightweight domain events (e.g., `appointment.cancelled`) dispatched via in-memory bus (Phase 2) with planned Kafka/SQS adapter (Phase 3).

  **✅ EXCELLENT:** Event-driven architecture for extensibility

  **📝 SIMPLE EVENT BUS IMPLEMENTATION:**

  ```javascript
  // backend/src/utils/eventBus.js

  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    on(eventName, handler) {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, []);
      }
      this.listeners.get(eventName).push(handler);
    }

    async emit(eventName, data) {
      const handlers = this.listeners.get(eventName) || [];
      // Execute handlers in parallel (consider sequential if order matters)
      await Promise.all(handlers.map(h => h(data)));
    }

    off(eventName, handler) {
      const handlers = this.listeners.get(eventName) || [];
      this.listeners.set(eventName, handlers.filter(h => h !== handler));
    }
  }

  export const eventBus = new EventBus();

  // Register listeners at startup
  // backend/src/config/events.js
  import { eventBus } from '../utils/eventBus.js';
  import { processWaitlist } from '../services/waitlist.service.js';

  export const registerEventListeners = () => {
    eventBus.on('appointment.cancelled', async (event) => {
      const { appointment } = event;
      await processWaitlist(appointment.calendar_id, {
        start: appointment.start_time,
        end: appointment.end_time
      });
    });

    eventBus.on('availability.created', async (event) => {
      const { slot } = event;
      await processWaitlist(slot.calendar_id, {
        start: slot.start_time,
        end: slot.end_time
      });
    });

    eventBus.on('appointment.created', async (event) => {
      await auditService.log({
        action: 'appointment.created',
        resource: 'appointments',
        resourceId: event.appointment.id,
        userId: event.userId,
        metadata: event.appointment
      });
    });
  };
  ```

  **💡 EVENTS TO IMPLEMENT:**
  - `appointment.created`
  - `appointment.updated`
  - `appointment.cancelled`
  - `availability.created`
  - `availability.updated`
  - `availability.deleted`
  - `user.role_assigned`
  - `user.role_removed`
  - `waitlist.entry_created`
  - `waitlist.entry_promoted`

### 2.3 Notifications Stub (Backend Ready)

**✅ EXCELLENT:** Stub approach for Phase 2

- **Interfaces**
  - `notification.service.js` with driver pattern (email/SMS/Slack).
  - Phase 2: log-based driver; Phase 3: integrate actual providers.

  **📝 INTERFACE DESIGN:**

  ```javascript
  // backend/src/services/notification/notification.service.js

  /**
   * Notification driver interface
   * All drivers must implement these methods
   */
  class NotificationDriver {
    async send(notification) {
      throw new Error('Not implemented');
    }

    async sendBatch(notifications) {
      // Default: send one by one
      return Promise.all(notifications.map(n => this.send(n)));
    }
  }

  /**
   * Log driver (Phase 2)
   * Logs notifications instead of sending
   */
  class LogDriver extends NotificationDriver {
    async send(notification) {
      console.log('📧 Notification (would be sent):', {
        to: notification.recipient,
        type: notification.type,
        channel: notification.channel,
        subject: notification.subject,
        body: notification.body
      });

      // Store in notifications table for testing
      await query(
        `INSERT INTO notification_log
         (tenant_id, user_id, type, channel, subject, body, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'logged', NOW())`,
        [
          notification.tenantId,
          notification.recipient,
          notification.type,
          notification.channel,
          notification.subject,
          notification.body
        ]
      );
    }
  }

  /**
   * Email driver (Phase 3)
   */
  class EmailDriver extends NotificationDriver {
    async send(notification) {
      // TODO: Integrate with SendGrid/AWS SES
    }
  }

  /**
   * SMS driver (Phase 3)
   */
  class SMSDriver extends NotificationDriver {
    async send(notification) {
      // TODO: Integrate with Twilio
    }
  }

  // Factory
  const drivers = {
    log: new LogDriver(),
    email: new EmailDriver(),
    sms: new SMSDriver()
  };

  export const sendNotification = async (params) => {
    const {
      tenantId,
      recipient,  // user ID or email
      type,       // 'booking_confirmation', 'cancellation', etc.
      channel = 'email',  // 'email', 'sms', 'slack'
      subject,
      body,
      metadata = {}
    } = params;

    const driver = drivers[channel] || drivers.log;

    return driver.send({
      tenantId,
      recipient,
      type,
      channel,
      subject,
      body,
      metadata
    });
  };
  ```

  **💡 NOTIFICATION LOG TABLE:**

  ```sql
  -- 0010_create_notification_log.sql
  CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject TEXT,
    body TEXT,
    status VARCHAR(50) NOT NULL,  -- logged, sent, failed
    error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_notification_log_tenant ON notification_log(tenant_id);
  CREATE INDEX idx_notification_log_user ON notification_log(user_id);
  CREATE INDEX idx_notification_log_type ON notification_log(type);
  CREATE INDEX idx_notification_log_status ON notification_log(status);
  CREATE INDEX idx_notification_log_created ON notification_log(created_at);
  ```

- **Trigger Points**
  - Booking confirmations, cancellations, waitlist promotions.

  **💡 ALL NOTIFICATION TRIGGERS:**
  - **Appointments:**
    - Booking confirmation (to client + provider)
    - Booking cancellation (to both parties)
    - Booking reminder (24h before, 1h before)
    - Booking rescheduled
  - **Waitlist:**
    - Added to waitlist confirmation
    - Promoted from waitlist (slot available)
    - Waitlist entry expiring soon
  - **Group Bookings:**
    - Invitation to group appointment
    - Participant confirmed
    - Participant declined
    - Group appointment confirmed (all accepted)
    - Group appointment cancelled
  - **Account:**
    - Welcome email
    - Password reset
    - Role assignment notification

### 2.4 Testing

**✅ GOOD:** Comprehensive test plan

- **Unit**
  - Group availability computation, waitlist prioritization.

  **💡 SPECIFIC TESTS:**
  ```javascript
  describe('Group Availability', () => {
    it('finds time slots when all providers available');
    it('returns empty when no common availability');
    it('excludes times with conflicts for any provider');
    it('respects max group size');
    it('handles timezone differences between providers');
  });

  describe('Waitlist Prioritization', () => {
    it('promotes highest priority entry first');
    it('uses FIFO for same priority');
    it('skips entries outside time window');
    it('respects auto_book flag');
    it('expires old entries');
  });
  ```

- **Integration**
  - Happy-path + conflict scenarios for group bookings.
  - Waitlist promotion when slot freed.

  **💡 CRITICAL INTEGRATION TESTS:**
  ```javascript
  describe('Waitlist Integration', () => {
    it('adds to waitlist when no slots available');

    it('auto-promotes when appointment cancelled', async () => {
      // 1. Create appointment
      // 2. Add user to waitlist for that time
      // 3. Cancel appointment
      // 4. Verify waitlist user gets promoted
      // 5. Verify notification sent
    });

    it('handles race condition with multiple waitlist entries', async () => {
      // Simulate 2 users on waitlist for same slot
      // Cancel appointment
      // Only ONE should be promoted
    });
  });
  ```

- **Contract Tests**
  - Notification service interface with mocked drivers.

  **✅ EXCELLENT:** Contract testing ensures Phase 3 driver implementations will work

---

## 3. Audit Trail & Observability (Week 8)

**✅ EXCELLENT:** Production-ready requirements

### 3.1 Audit Logging

- **Schema**
  - `audit_logs` table capturing actor, action, resource, metadata, timestamp.

  **💡 DETAILED SCHEMA:**

  ```sql
  -- 0011_create_audit_logs.sql

  CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Who did it
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),  -- Snapshot in case user deleted
    actor_role VARCHAR(50),
    actor_ip_address INET,

    -- What was done
    action VARCHAR(100) NOT NULL,  -- e.g., 'appointment.created', 'user.role_assigned'
    resource_type VARCHAR(50) NOT NULL,  -- e.g., 'appointments', 'users'
    resource_id UUID,

    -- Context
    http_method VARCHAR(10),
    request_path TEXT,
    user_agent TEXT,

    -- Metadata (before/after values, etc.)
    metadata JSONB,

    -- Result
    status VARCHAR(50) NOT NULL,  -- success, failure
    error_message TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
  CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
  CREATE INDEX idx_audit_logs_action ON audit_logs(action);
  CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
  CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
  CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

  -- Partitioning by month (for performance as table grows)
  -- See Phase 3 for partition strategy
  ```

  **⚠️ DATA RETENTION:**
  - Audit logs can grow very large
  - Consider partition by month from day 1
  - Define retention policy (e.g., 2 years)
  - Implement archival process in Phase 3

- **Middleware**
  - `auditLogger` decorating request lifecycle (post-success only).

  **📝 IMPLEMENTATION:**

  ```javascript
  // backend/src/middleware/audit.middleware.js

  export const auditLogger = (options = {}) => {
    const { excludePaths = [], includeBody = false } = options;

    return async (req, res, next) => {
      // Skip audit for certain paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Capture original res.json
      const originalJson = res.json.bind(res);

      res.json = function(body) {
        // After response, log the audit entry
        setImmediate(async () => {
          try {
            await auditService.log({
              tenantId: req.user?.tenantId,
              actorId: req.user?.id,
              actorEmail: req.user?.email,
              actorRole: req.user?.role,
              actorIpAddress: req.ip,
              action: `${req.method}.${req.path}`,
              resourceType: inferResourceType(req.path),
              resourceId: req.params.id || body?.id,
              httpMethod: req.method,
              requestPath: req.originalUrl,
              userAgent: req.get('user-agent'),
              metadata: {
                params: req.params,
                query: req.query,
                body: includeBody ? sanitizeBody(req.body) : undefined,
                response: includeBody ? sanitizeBody(body) : undefined
              },
              status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure',
              errorMessage: res.statusCode >= 400 ? body?.error?.message : undefined
            });
          } catch (error) {
            // Never fail request due to audit logging error
            console.error('Audit logging error:', error);
          }
        });

        return originalJson(body);
      };

      next();
    };
  };

  // Helper to sanitize sensitive data
  function sanitizeBody(body) {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }
  ```

  **⚠️ PERFORMANCE CONSIDERATION:**
  - Writing audit logs on every request can slow down responses
  - Use `setImmediate` to defer audit write until after response sent
  - Consider batching audit logs (write every 5 seconds instead of immediately)
  - **Phase 3:** Move to background queue

- **Service**
  - `audit.service.js` with batching (optional), log rotation strategy.

  **💡 BATCHING IMPLEMENTATION:**

  ```javascript
  // backend/src/services/audit.service.js

  class AuditService {
    constructor() {
      this.buffer = [];
      this.batchSize = parseInt(process.env.AUDIT_BATCH_SIZE) || 100;
      this.flushInterval = parseInt(process.env.AUDIT_BATCH_INTERVAL) || 5000;
      this.startFlushTimer();
    }

    async log(entry) {
      this.buffer.push(entry);

      if (this.buffer.length >= this.batchSize) {
        await this.flush();
      }
    }

    async flush() {
      if (this.buffer.length === 0) return;

      const batch = this.buffer.splice(0, this.batchSize);

      try {
        // Batch insert
        const values = batch.map((entry, i) => {
          const offset = i * 14;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, ..., $${offset + 14})`;
        }).join(', ');

        const params = batch.flatMap(entry => [
          entry.tenantId,
          entry.actorId,
          entry.actorEmail,
          // ... all fields
        ]);

        await query(
          `INSERT INTO audit_logs (...) VALUES ${values}`,
          params
        );
      } catch (error) {
        console.error('Failed to flush audit logs:', error);
        // Re-add to buffer? Or send to dead letter queue?
      }
    }

    startFlushTimer() {
      setInterval(() => this.flush(), this.flushInterval);
    }
  }

  export const auditService = new AuditService();
  ```

### 3.2 Metrics & Health Enhancements

- **Expose**
  - `/metrics` endpoint (Prometheus format) with auth guard.

  **📝 IMPLEMENTATION:**

  ```javascript
  // backend/src/routes/metrics.routes.js
  import { Router } from 'express';
  import { register } from 'prom-client';
  import { authenticate, requirePermissions } from '../middleware/auth.middleware.js';

  const router = Router();

  router.get(
    '/metrics',
    authenticate,
    requirePermissions(['metrics:read']),
    (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(register.metrics());
    }
  );

  export default router;
  ```

  **💡 USE LIBRARY:** `prom-client` (npm)

  ```javascript
  // backend/src/utils/metrics.js
  import { register, Counter, Histogram, Gauge } from 'prom-client';

  // HTTP metrics
  export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
  });

  export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5]
  });

  // Business metrics
  export const appointmentsCreated = new Counter({
    name: 'appointments_created_total',
    help: 'Total appointments created',
    labelNames: ['tenant_id']
  });

  export const appointmentsCancelled = new Counter({
    name: 'appointments_cancelled_total',
    help: 'Total appointments cancelled',
    labelNames: ['tenant_id', 'reason']
  });

  export const waitlistSize = new Gauge({
    name: 'waitlist_size',
    help: 'Current waitlist size',
    labelNames: ['tenant_id', 'calendar_id']
  });

  export const waitlistPromotions = new Counter({
    name: 'waitlist_promotions_total',
    help: 'Total waitlist promotions',
    labelNames: ['tenant_id']
  });
  ```

  - Collect counters: bookings created, cancellations, waitlist promotions.

  **💡 ADDITIONAL METRICS TO TRACK:**
  - Database connection pool usage
  - Redis cache hit/miss rate
  - RBAC permission cache hit rate
  - Average appointment duration
  - Peak booking hours
  - Provider utilization rate
  - API response times (p50, p95, p99)
  - Error rate by endpoint
  - Group appointment success rate

- **Logging**
  - Extend Winston transports for structured audit output.

  **📝 WINSTON CONFIGURATION:**

  ```javascript
  // backend/src/config/logger.js
  import winston from 'winston';

  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'booking-system-backend',
      environment: process.env.NODE_ENV
    },
    transports: [
      // Console for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),

      // File for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: 'info'
      }),

      // File for errors only
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }),

      // File for audit logs (separate from app logs)
      new winston.transports.File({
        filename: 'logs/audit.log',
        level: 'info',
        format: winston.format((info) => {
          return info.audit ? info : false;
        })()
      })
    ]
  });

  // Audit log helper
  export const auditLog = (data) => {
    logger.info({
      audit: true,
      ...data
    });
  };
  ```

### 3.3 Testing

- **Unit**
  - Audit service formatting, redact sensitive fields.

  **💡 TEST CASES:**
  ```javascript
  describe('Audit Service', () => {
    it('redacts password from request body');
    it('redacts token from metadata');
    it('batches logs when buffer full');
    it('flushes logs on timer');
    it('handles flush errors gracefully');
  });
  ```

- **Integration**
  - Ensure critical endpoints emit audit entries.

  **💡 TEST EXAMPLE:**
  ```javascript
  it('creates audit log when appointment created', async () => {
    const before = await getAuditLogCount();

    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(appointmentData);

    const after = await getAuditLogCount();
    expect(after).toBe(before + 1);

    const auditLog = await getLatestAuditLog();
    expect(auditLog.action).toContain('appointment');
    expect(auditLog.actor_id).toBe(userId);
  });
  ```

  - Validate metrics increments via supertest (mock Prometheus registry).

  **💡 METRICS TESTING:**
  ```javascript
  import { register } from 'prom-client';

  it('increments appointment counter', async () => {
    const before = await register.getSingleMetric('appointments_created_total').get();

    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(appointmentData);

    const after = await register.getSingleMetric('appointments_created_total').get();
    expect(after.values[0].value).toBeGreaterThan(before.values[0].value);
  });
  ```

---

## 4. Frontend Enhancements (Weeks 8-9)

**✅ GOOD:** Frontend work properly scoped

**💡 GENERAL RECOMMENDATION:**
This section is lighter on detail than backend sections. Consider creating separate `frontend-phase-2-plan.md` with:
- Component mockups/wireframes
- State management strategy (Context? Zustand? Redux?)
- API client architecture
- Form validation strategy
- Error handling patterns

### 4.1 Role-Aware UX

- **Routing**
  - Protect routes with RBAC guard (React context + hook).

  **📝 IMPLEMENTATION:**

  ```javascript
  // frontend/src/contexts/AuthContext.jsx
  export const useAuth = () => {
    const context = useContext(AuthContext);
    return {
      user: context.user,
      permissions: context.permissions,
      hasPermission: (permission) => context.permissions.includes(permission),
      hasAnyPermission: (perms) => perms.some(p => context.permissions.includes(p)),
      hasAllPermissions: (perms) => perms.every(p => context.permissions.includes(p))
    };
  };

  // frontend/src/components/ProtectedRoute.jsx
  export const ProtectedRoute = ({ children, requiredPermissions, fallback }) => {
    const { hasAllPermissions, loading } = useAuth();

    if (loading) return <LoadingSpinner />;

    if (!hasAllPermissions(requiredPermissions)) {
      return fallback || <Navigate to="/unauthorized" />;
    }

    return children;
  };

  // Usage:
  <Route
    path="/admin/roles"
    element={
      <ProtectedRoute requiredPermissions={['roles:read']}>
        <RoleManagementPage />
      </ProtectedRoute>
    }
  />
  ```

  - Display features based on permissions (e.g., admin dashboards, waitlist view).

  **📝 CONDITIONAL RENDERING:**

  ```javascript
  export const AppointmentCard = ({ appointment }) => {
    const { hasPermission } = useAuth();

    return (
      <Card>
        <CardContent>
          {/* Everyone can see basic info */}
          <Typography>{appointment.time}</Typography>

          {/* Only with permission */}
          {hasPermission('appointments:update') && (
            <Button onClick={handleEdit}>Edit</Button>
          )}

          {hasPermission('appointments:delete') && (
            <Button onClick={handleCancel}>Cancel</Button>
          )}
        </CardContent>
      </Card>
    );
  };
  ```

- **Components**
  - Role management UI (assign roles, view permissions).
  - Waitlist management panel.
  - Group booking flow (participant selector, availability overlay).

  **💡 COMPONENT BREAKDOWN:**

  **Role Management:**
  - `RoleList.jsx` - List all roles in tenant
  - `RoleDetails.jsx` - View role permissions
  - `RoleForm.jsx` - Create/edit custom role
  - `UserRoleAssignment.jsx` - Assign roles to user

  **Waitlist:**
  - `WaitlistButton.jsx` - "Add to waitlist" when no slots
  - `WaitlistEntries.jsx` - User's active waitlist entries
  - `WaitlistManagement.jsx` - Admin view of all waitlist entries

  **Group Booking:**
  - `GroupBookingWizard.jsx` - Multi-step wizard
  - `ParticipantSelector.jsx` - Select providers/participants
  - `GroupAvailabilityCalendar.jsx` - Show common availability
  - `GroupBookingConfirmation.jsx` - Confirm and send invites

### 4.2 State & Data Fetching

- **Enhancements**
  - Integrate React Query for caching RBAC/availability data.

  **✅ EXCELLENT CHOICE:** React Query is perfect for this use case

  **📝 SETUP:**

  ```javascript
  // frontend/src/hooks/usePermissions.js
  import { useQuery } from '@tanstack/react-query';
  import { api } from '../api/client';

  export const usePermissions = () => {
    return useQuery({
      queryKey: ['permissions', 'me'],
      queryFn: () => api.get('/rbac/me/permissions'),
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60 * 24 // 24 hours
    });
  };

  // frontend/src/hooks/useWaitlist.js
  export const useWaitlist = (userId) => {
    return useQuery({
      queryKey: ['waitlist', userId],
      queryFn: () => api.get(`/waitlist/user/${userId}`),
      refetchInterval: 30000 // Poll every 30s for promotions
    });
  };

  export const useAddToWaitlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data) => api.post('/waitlist', data),
      onSuccess: () => {
        queryClient.invalidateQueries(['waitlist']);
      }
    });
  };
  ```

  **💡 CACHE STRATEGIES:**
  - **Permissions:** Cache 1 hour, invalidate on role change
  - **Availability:** Cache 5 minutes, invalidate on booking
  - **Waitlist:** Poll every 30s for real-time updates
  - **Group appointments:** Cache 1 minute, invalidate on participant action

  - Centralized API client handling 401/403 with re-auth workflow.

  **📝 API CLIENT:**

  ```javascript
  // frontend/src/api/client.js
  import axios from 'axios';
  import { authService } from '../services/auth.service';

  export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true // For refresh token cookie
  });

  // Request interceptor: Attach access token
  api.interceptors.request.use((config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: Handle 401 with token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 and haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          await authService.refreshToken();

          // Retry original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          authService.logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // If 403, show unauthorized message
      if (error.response?.status === 403) {
        // Could dispatch a global notification
        // toast.error('You do not have permission to perform this action');
      }

      return Promise.reject(error);
    }
  );
  ```

### 4.3 Testing

- **Unit**
  - Hooks: `usePermissions`, `useWaitlist`.

  **📝 TESTING HOOKS:**

  ```javascript
  // frontend/src/hooks/__tests__/usePermissions.test.js
  import { renderHook, waitFor } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { usePermissions } from '../usePermissions';
  import { api } from '../../api/client';

  jest.mock('../../api/client');

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    return ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  describe('usePermissions', () => {
    it('fetches and returns permissions', async () => {
      api.get.mockResolvedValue({
        data: { permissions: ['appointments:create'] }
      });

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data.permissions).toContain('appointments:create');
    });
  });
  ```

- **Component**
  - Role-based rendering, group booking wizard.

  **📝 COMPONENT TESTING:**

  ```javascript
  // frontend/src/components/__tests__/ProtectedRoute.test.jsx
  import { render, screen } from '@testing-library/react';
  import { ProtectedRoute } from '../ProtectedRoute';
  import { AuthContext } from '../../contexts/AuthContext';

  describe('ProtectedRoute', () => {
    it('renders children when user has permission', () => {
      const mockAuth = {
        user: { id: '1', email: 'test@test.com' },
        permissions: ['appointments:create'],
        hasAllPermissions: jest.fn(() => true)
      };

      render(
        <AuthContext.Provider value={mockAuth}>
          <ProtectedRoute requiredPermissions={['appointments:create']}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects when user lacks permission', () => {
      const mockAuth = {
        user: { id: '1', email: 'test@test.com' },
        permissions: [],
        hasAllPermissions: jest.fn(() => false)
      };

      render(
        <AuthContext.Provider value={mockAuth}>
          <ProtectedRoute requiredPermissions={['appointments:create']}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
  ```

- **E2E**
  - Cypress/Playwright flows: admin role change, group booking, waitlist promotion.

  **📝 E2E TEST:**

  ```javascript
  // frontend/tests/e2e/rbac.spec.js
  import { test, expect } from '@playwright/test';

  test('admin can assign role to user', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@test.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');

    // Navigate to role management
    await page.goto('/admin/roles');

    // Select user
    await page.click('[data-testid=assign-role-button]');
    await page.selectOption('[name=userId]', 'user-uuid');
    await page.selectOption('[name=roleId]', 'provider-role-uuid');
    await page.click('button:has-text("Assign")');

    // Verify success
    await expect(page.locator('.success-message')).toContainText('Role assigned');
  });

  test('waitlist promotion flow', async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('[name=email]', 'client@test.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');

    // Try to book (no availability)
    await page.goto('/appointments/new');
    await page.selectOption('[name=providerId]', 'provider-uuid');
    await page.fill('[name=date]', '2025-11-01');
    await page.click('button:has-text("Search")');

    // No slots available, add to waitlist
    await page.click('button:has-text("Add to Waitlist")');
    await expect(page.locator('.success-message')).toContainText('Added to waitlist');

    // Simulate provider cancelling appointment (in another session)
    // ... backend simulates cancellation and waitlist promotion ...

    // Check notifications (or poll waitlist status)
    await page.goto('/waitlist');
    await expect(page.locator('[data-status=promoted]')).toBeVisible();
  });
  ```

  **💡 E2E TESTING RECOMMENDATION:**
  Use **Playwright** over Cypress for:
  - Better multi-browser support
  - Parallel execution
  - Auto-wait for elements
  - Better debugging

---

## 5. Tooling & Quality Gates

**✅ EXCELLENT:** Quality-first approach

1. **Migrations**
   - Add `backend/src/config/migrations/sql/0007_*` onwards with down scripts.

   **💡 MIGRATION NAMING CONVENTION:**
   ```
   0007_create_rbac_tables.sql / .down.sql
   0008_create_group_appointments.sql / .down.sql
   0009_create_waitlist.sql / .down.sql
   0010_create_notification_log.sql / .down.sql
   0011_create_audit_logs.sql / .down.sql
   0012_seed_rbac_permissions.sql / .down.sql
   ```

   **⚠️ TESTING MIGRATIONS:**
   - Test up AND down migrations
   - Ensure rollback works cleanly
   - Test with data in tables (not just empty)

   - Update migration README with Phase 2 philosophy.

   **✅ GOOD**

2. **Lint & Format**
   - Extend lint rules to new directories (`rbac`, `notifications`, etc.).

   **💡 ESLINT UPDATES:**
   ```javascript
   // .eslintrc.js
   module.exports = {
     // ... existing config
     rules: {
       // Enforce permission naming convention
       'no-restricted-syntax': [
         'error',
         {
           selector: 'Literal[value=/^[a-z]+:[a-z]+$/]',
           message: 'Permission strings must follow resource:action format'
         }
       ]
     }
   };
   ```

3. **Testing Pipeline**
   - Ensure `npm run test -- --runInBand` covers integration suites in CI (services via Docker compose).

   **✅ ALREADY DONE IN PHASE 1**

   - Add coverage thresholds for new modules (≥80%).

   **📝 JEST CONFIG UPDATE:**
   ```javascript
   // jest.config.js
   export default {
     // ... existing config
     coverageThreshold: {
       global: {
         statements: 70,
         branches: 70,  // Was 53%, need to improve
         functions: 70,
         lines: 70
       },
       // Stricter for new Phase 2 modules
       './src/services/rbac.service.js': {
         statements: 80,
         branches: 80,
         functions: 80,
         lines: 80
       },
       './src/services/waitlist.service.js': {
         statements: 80,
         branches: 75,
         functions: 80,
         lines: 80
       },
       './src/services/groupBooking.service.js': {
         statements: 80,
         branches: 75,
         functions: 80,
         lines: 80
       }
     }
   };
   ```

4. **Security**
   - Run `npm audit` and dependency review before Phase 2 sign-off.

   **✅ GOOD - Also fix the 2 moderate vulnerabilities from Phase 1**

   - Threat model RBAC workflows (document in `docs/security/rbac-threat-model.md`).

   **💡 THREAT MODEL TEMPLATE:**
   ```markdown
   # RBAC Threat Model

   ## Assets
   - User permissions
   - Role definitions
   - Permission cache in Redis
   - Audit logs

   ## Threats
   1. **Privilege Escalation**
      - Attack: User assigns themselves admin role
      - Mitigation: Require higher permission to assign high-privilege roles

   2. **Permission Cache Poisoning**
      - Attack: Manipulate Redis to grant unauthorized permissions
      - Mitigation: Sign cache entries, validate on read

   3. **Audit Log Tampering**
      - Attack: Delete audit logs to hide actions
      - Mitigation: Append-only logs, separate DB, immutable storage

   ## Attack Scenarios
   ...
   ```

---

## 6. Milestones & Exit Criteria

**✅ EXCELLENT:** Clear milestones and ownership

| Milestone | Key Deliverables | Acceptance Tests | Owner |
|-----------|------------------|------------------|-------|
| RBAC Core | Roles/permissions tables, middleware, caching | Unit + integration RBAC suites passing | Backend |
| Advanced Booking | Group bookings, waitlist, notification stubs | Integration tests, E2E for group flow | Backend + Frontend |
| Audit & Metrics | Audit log service, `/metrics` endpoint | Audit integration tests, metric validation | Backend |
| Frontend RBAC | Role-aware navigation, waitlist UI | Vitest component tests, Playwright paths | Frontend |
| Quality Gate | CI green (lint, tests), docs updated | Manual review + ✅ checklist | Team |

**💡 ADDITIONAL MILESTONE RECOMMENDATIONS:**

Add specific **success metrics** to each milestone:
- RBAC Core: Permission check latency < 50ms (95th percentile)
- Advanced Booking: Group availability search < 2s for 3 providers
- Audit & Metrics: Audit log write doesn't increase API latency > 10ms
- Frontend RBAC: Permission checks don't cause UI flicker

**💡 ADD DEMO MILESTONE:**
- **Week 8.5:** Internal demo to stakeholders
- Show: Role assignment, group booking, waitlist promotion, audit log review
- Goal: Get feedback before final week

---

## 7. Risk Register & Mitigations

**✅ EXCELLENT:** Proactive risk identification

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Permission drift between backend & frontend | Medium | High | Derive frontend permission map from backend endpoint (`/rbac/permissions`) |
| Waitlist auto-booking race conditions | Medium | High | Use Postgres advisory locks or `FOR UPDATE SKIP LOCKED` when promoting entries |
| Audit log volume growth | Medium | Medium | Partition table by month, archive job (Phase 3) |
| Test flakiness due to concurrent Redis connections | Low | Medium | Reuse Redis client, isolate keys per test tenant |

**💡 ADDITIONAL RISKS:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| **Group booking complexity causes delays** | High | High | **Descope to Phase 3 if needed.** Implement basic version first (max 2-3 participants), enhance later |
| **Permission caching causes stale data** | Medium | High | Aggressive cache invalidation, add "force refresh" button, monitor cache hit rate |
| **RBAC migration breaks existing role checks** | Medium | High | Keep old `requireRole` middleware during transition, parallel testing, feature flag |
| **Audit logs impact performance** | Medium | Medium | Batch writes, async processing, monitor API latency metrics |
| **Frontend role UI is confusing** | Medium | Medium | UX review, user testing with mockups, progressive disclosure of complex features |
| **Redis connection pooling issues in tests** | Low | High | Use separate Redis DB index for tests, reset between test suites |
| **Group availability query too slow** | High | Medium | Add database indexes, limit to 5 providers, cache results, add timeout |

---

## 8. Definition of Done (Per Feature)

**✅ EXCELLENT:** Clear DoD

1. Code merged with review approval.
2. Unit + integration tests implemented and passing (frontend components included).
3. Coverage ≥80% for new modules or documented rationale.
4. Migrations applied + rollback verified locally.
5. API docs & changelog updated.
6. Security/privacy review notes captured (especially for RBAC and audit logging).

**💡 ADDITIONS TO DOD:**

7. **Performance benchmarks met** (latency, query time)
8. **Manual QA performed** for critical paths (role assignment, group booking, waitlist)
9. **Documentation updated** (API docs, user guides, migration guides)
10. **Monitoring added** (metrics, alerts, dashboards)
11. **Security scan passed** (npm audit, dependency check)
12. **Accessibility checked** (WCAG AA for frontend components)

---

## 9. Next Actions

**✅ GOOD:** Clear next steps

1. Create ticket backlog aligned with milestones above (tag `PH2-*`).

   **💡 SUGGESTED TICKETS:**
   ```
   PH2-001: Design RBAC database schema
   PH2-002: Implement role repository
   PH2-003: Implement permission repository
   PH2-004: Implement RBAC service with caching
   PH2-005: Create requirePermissions middleware
   PH2-006: Create requireOwnership middleware
   PH2-007: Add RBAC endpoints (roles, permissions)
   PH2-008: Migrate existing routes to permission checks
   PH2-009: Write RBAC integration tests
   PH2-010: Write RBAC security tests
   ...
   ```

2. Draft migration scripts for RBAC tables (`0007_` series).

   **✅ PRIORITY 1** - Start here

3. Spike RBAC permission caching strategy (Redis keys & invalidation).

   **✅ PRIORITY 2** - Do this before implementing RBAC service

4. Update `README.md` roadmap section to include Phase 2 highlights.

   **✅ GOOD**

**💡 ADDITIONAL PRE-WORK:**

5. **Create mockups for role management UI** (Figma/Sketch)
6. **Document RBAC permission matrix** (role → permissions mapping)
7. **Benchmark current performance** (response times, query times) for comparison
8. **Set up Prometheus + Grafana** (for metrics visualization)
9. **Review npm audit** and fix 2 moderate vulnerabilities from Phase 1

---

## Overall Feedback Summary

### ⭐ Strengths

1. **Comprehensive Planning** - Excellent detail on architecture, schema, testing
2. **Risk Awareness** - Proactive risk identification and mitigation
3. **Quality Focus** - Clear DoD, coverage thresholds, security reviews
4. **Modular Architecture** - Clean separation (repositories, services, middleware)
5. **Future-Proofing** - Event system, notification drivers, cache strategy

### ⚠️ Areas of Concern

1. **Scope Ambition** - Group bookings + waitlist + notifications is a LOT for 2 weeks
   - **RECOMMENDATION:** Be prepared to descope group bookings to Phase 3 if timeline slips

2. **Frontend Detail** - Frontend sections less detailed than backend
   - **RECOMMENDATION:** Create separate frontend-phase-2-plan.md with mockups

3. **Performance Risks** - Group availability search, audit logging, RBAC checks could be slow
   - **RECOMMENDATION:** Set performance budgets, add latency metrics, load test early

4. **Migration Path** - Existing role checks → new permission system needs careful transition
   - **RECOMMENDATION:** Keep both systems running in parallel, feature flag, gradual rollout

### 💡 Key Recommendations

1. **PRIORITIZE:**
   - Week 6: RBAC core (critical foundation)
   - Week 7: Waitlist (high value, manageable scope)
   - Week 8: Audit + observability
   - Week 9: Frontend + testing
   - **DESCOPE:** Group bookings to Phase 3 if needed

2. **ADD TO PHASE 2:**
   - Performance benchmarking (before/after metrics)
   - UX mockups for role management UI
   - Security penetration testing
   - Migration guide for existing users
   - Monitoring dashboards (Grafana)

3. **TECHNICAL DEEP DIVES NEEDED:**
   - RBAC caching strategy (spike this first!)
   - Group availability algorithm (complex!)
   - Waitlist race condition handling (Postgres locks)
   - Audit log batching vs. real-time

4. **TESTING FOCUS:**
   - RBAC security tests (privilege escalation, cross-tenant, etc.)
   - Waitlist race condition tests (concurrent promotions)
   - Permission caching (hit/miss, invalidation)
   - E2E tests for critical flows

### ✅ Approval

**Phase 2 plan is APPROVED with recommendations to:**
1. Create detailed frontend plan with mockups
2. Spike RBAC caching strategy before implementation
3. Set performance budgets and monitor throughout
4. Be prepared to descope group bookings if timeline slips
5. Add security penetration testing to scope

**Estimated Effort:** 4 weeks (as planned, assuming no descoping)
**Risk Level:** Medium-High (ambitious scope, complex features)
**Recommendation:** Proceed with caution, monitor velocity closely, adjust scope as needed

---

**Reviewed by:** Technical Lead
**Date:** 2025-10-16
**Status:** ✅ Approved with Recommendations
**Next Review:** End of Week 6 (RBAC Core milestone)
