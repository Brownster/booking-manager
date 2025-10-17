# Phase 2 Remaining Tasks

**Current Status:** 75% Complete
**Estimated Remaining Time:** 90-120 hours (2-3 weeks with 1 developer)
**Last Updated:** 2025-10-17

---

## Overview

Phase 2 has strong momentum with the waitlist system and group booking wizard complete. The remaining work focuses on connecting existing scaffolding to backend APIs, implementing authentication, and adding test coverage.

---

## Priority 1: Critical Path (Blocking) 🚨

### Task 1.1: Authentication UI Implementation

**Estimate:** 6-8 hours
**Assignee:** New Developer
**Priority:** CRITICAL (Blocks all user flows)

**Description:**
Implement complete authentication system with login/logout UI. Currently, the AuthContext is a placeholder and there's no way for users to authenticate.

**Subtasks:**

1. **Implement AuthContext** (2-3 hours)
   - File: `frontend/src/context/AuthContext.jsx`
   - Features needed:
     - `login(email, password, tenantId)` function
     - `logout()` function
     - `refreshToken()` function
     - `user` state object
     - `isAuthenticated` boolean
     - `isLoading` boolean
   - Store access token in memory
   - Refresh token in httpOnly cookie (backend sets this)
   - Auto-refresh on mount if refresh token exists
   - Clear state on logout

2. **Create Login Page** (2-3 hours)
   - File: `frontend/src/pages/LoginPage.jsx`
   - UI components:
     - Email input field
     - Password input field
     - Tenant ID input (or dropdown)
     - Login button
     - "Remember me" checkbox
     - Error message display
   - Form validation:
     - Email format validation
     - Password minimum length
     - Required field validation
   - Success flow:
     - Call AuthContext.login()
     - Redirect to dashboard on success
     - Show error message on failure

3. **Add Protected Routes** (1 hour)
   - File: `frontend/src/router/index.jsx`
   - Create ProtectedRoute wrapper component
   - Check isAuthenticated from AuthContext
   - Redirect to /login if not authenticated
   - Preserve intended destination (returnUrl)

4. **Add Logout UI** (1 hour)
   - File: `frontend/src/components/layout/AppLayout.jsx`
   - Add user dropdown menu in header
   - Include logout button
   - Call AuthContext.logout()
   - Redirect to login page

5. **Testing** (1-2 hours)
   - Manual testing of login flow
   - Test token refresh
   - Test logout clears state
   - Test protected routes redirect
   - Test "remember me" functionality

**Acceptance Criteria:**
- [ ] User can log in with valid credentials
- [ ] Access token stored in memory (not localStorage)
- [ ] Refresh token handled by httpOnly cookie
- [ ] Login errors displayed to user
- [ ] Protected routes redirect to login
- [ ] Logout clears all auth state
- [ ] Real permissions loaded after login (not placeholder)
- [ ] Token auto-refreshes when expired

**API Endpoints (already implemented):**
```
POST /api/v1/auth/login
  Body: { email, password, tenantId }
  Response: { user, tokens }

POST /api/v1/auth/logout
  Body: { refreshToken }

POST /api/v1/auth/refresh
  Body: { refreshToken }
  Response: { tokens }

GET /api/v1/auth/me
  Headers: { Authorization: Bearer <token> }
  Response: { user }
```

**Dependencies:**
- None (can start immediately)

**Blocks:**
- All user testing
- Role-based dashboard testing
- Permission testing with real users

---

### Task 1.2: RBAC Admin Modals

**Estimate:** 6-10 hours
**Assignee:** New Developer
**Priority:** HIGH (User-facing feature)

**Description:**
Complete the RBAC administration UI by adding CRUD modals for role management. Backend endpoints exist and work perfectly - just need frontend modals.

**Subtasks:**

1. **Create Role Modal** (2-3 hours)
   - File: `frontend/src/components/rbac/CreateRoleModal.jsx`
   - Form fields:
     - Role name (required)
     - Role description (optional)
     - Permission checkboxes (grouped by resource)
   - Fetch permissions catalog on mount
   - Group permissions by resource (appointments, calendars, etc.)
   - Validate: name is unique, at least one permission selected
   - Call `rbacService.createRole()`
   - Invalidate React Query cache on success
   - Show success/error messages

2. **Edit Role Modal** (2-3 hours)
   - File: `frontend/src/components/rbac/EditRoleModal.jsx`
   - Load existing role data
   - Pre-check permissions the role has
   - Allow changing description and permissions
   - Disable name editing (can't change role name)
   - System role protection (show "System Role - Cannot Edit" message)
   - Call `rbacService.updateRole()`
   - Invalidate cache on success

3. **Delete Role Confirmation** (1 hour)
   - File: `frontend/src/components/rbac/DeleteRoleModal.jsx`
   - Simple confirmation dialog
   - Show role name being deleted
   - Warn if role has users assigned (fetch count)
   - System role protection (disable delete button)
   - Call `rbacService.deleteRole()`
   - Handle error if role is in use

4. **Wire Up AdminRolesPage** (1-2 hours)
   - File: `frontend/src/pages/AdminRolesPage.jsx`
   - Connect "Create Role" button to modal
   - Connect "Edit" button on each card to modal
   - Connect "Delete" button to confirmation
   - Add React Query mutations:
     ```javascript
     const createMutation = useMutation({
       mutationFn: createRole,
       onSuccess: () => {
         queryClient.invalidateQueries(['rbac', 'roles']);
         createModal.onClose();
       }
     });
     ```
   - Handle loading states (disable buttons while mutating)
   - Show success/error toasts

5. **User Assignment Modal** (Optional - 2 hours)
   - File: `frontend/src/components/rbac/AssignRoleModal.jsx`
   - User picker (can use placeholder if user listing API doesn't exist)
   - Role dropdown
   - Optional expiration date (for temporary assignments)
   - Call `rbacService.assignRoleToUser()`
   - Show current role assignments for user

6. **Testing** (1 hour)
   - Create custom role
   - Edit role permissions
   - Try to edit system role (should block)
   - Delete custom role
   - Try to delete system role (should block)
   - Assign role to user (if implemented)

**Acceptance Criteria:**
- [ ] Admin can create custom roles with permissions
- [ ] Admin can edit role permissions
- [ ] System roles show as read-only
- [ ] Admin can delete custom roles
- [ ] Cannot delete system roles
- [ ] Changes reflect immediately in UI
- [ ] Error messages shown for failures
- [ ] Loading states shown during operations

**API Endpoints (already implemented):**
```
GET /api/v1/rbac/permissions
  Response: { permissions: [...] }

POST /api/v1/rbac/roles
  Body: { name, description, permissionIds }
  Response: { role }

PUT /api/v1/rbac/roles/:roleId
  Body: { description, permissionIds }
  Response: { role }

DELETE /api/v1/rbac/roles/:roleId
  Response: { success }

POST /api/v1/rbac/users/:userId/roles
  Body: { roleId, expiresAt? }
  Response: { roles }

DELETE /api/v1/rbac/users/:userId/roles/:roleId
  Response: { roles }
```

**Reference Implementation:**
- Look at `frontend/src/pages/WaitlistPage.jsx` for modal patterns
- Look at `frontend/src/components/rbac/RoleDetailsModal.jsx` for existing structure

**Dependencies:**
- None (can start immediately)
- Optional: User listing API (can use placeholder)

**Blocks:**
- Role management by admins
- Custom role creation
- Permission assignment

---

## Priority 2: Core Features 🔥

### Task 2.1: Group Booking Backend

**Estimate:** 15-20 hours
**Assignee:** New Developer + Claude Code
**Priority:** MEDIUM (Frontend wizard already complete)

**Description:**
Implement backend for group appointments. The frontend wizard is fully functional and ready to connect.

**Subtasks:**

1. **Database Migration** (2-3 hours)
   - File: `backend/src/config/migrations/sql/0011_create_group_appointments.sql`
   - Tables needed:
     ```sql
     group_appointments (
       id, tenant_id, name, description,
       start_time, end_time, duration_minutes,
       max_participants, status,
       created_by, created_at, updated_at
     )

     group_appointment_providers (
       group_appointment_id, provider_user_id,
       confirmed, confirmed_at
     )

     group_appointment_participants (
       group_appointment_id, participant_user_id,
       status (invited, confirmed, declined, cancelled),
       invited_at, confirmed_at
     )
     ```
   - Indexes on tenant_id, start_time, status
   - Foreign keys with CASCADE

2. **Repository Layer** (3-4 hours)
   - File: `backend/src/repositories/groupAppointment.repository.js`
   - Functions:
     - `createGroupAppointment()` - Insert with transaction
     - `addProviders()` - Bulk insert providers
     - `addParticipants()` - Bulk insert participants
     - `listGroupAppointments()` - With filters
     - `getGroupAppointmentById()` - With providers & participants
     - `updateGroupAppointment()` - Update details
     - `cancelGroupAppointment()` - Soft delete
     - `confirmParticipant()` - Update participant status
     - `checkProviderAvailability()` - Conflict detection

3. **Service Layer** (4-6 hours)
   - File: `backend/src/services/groupAppointment.service.js`
   - Business logic:
     - Validate providers exist and are active
     - Check provider availability (no conflicts)
     - Validate participant count doesn't exceed max
     - Ensure all users belong to tenant
     - Send notifications (stub for now)
     - Handle cancellations (notify all)
   - Functions:
     - `createGroupAppointment()`
     - `listGroupAppointments()`
     - `getGroupAppointment()`
     - `updateGroupAppointment()`
     - `cancelGroupAppointment()`
     - `confirmParticipant()`
     - `declineParticipant()`

4. **Controller & Routes** (2-3 hours)
   - File: `backend/src/controllers/groupAppointment.controller.js`
   - File: `backend/src/routes/groupAppointments.routes.js`
   - Endpoints:
     ```
     POST   /api/v1/group-appointments
     GET    /api/v1/group-appointments
     GET    /api/v1/group-appointments/:id
     PUT    /api/v1/group-appointments/:id
     DELETE /api/v1/group-appointments/:id
     POST   /api/v1/group-appointments/:id/confirm
     POST   /api/v1/group-appointments/:id/decline
     ```
   - Permission guards:
     - Create: `groupAppointments:create`
     - Read: `groupAppointments:read`
     - Update: `groupAppointments:update`
     - Delete: `groupAppointments:delete`

5. **Validators** (1-2 hours)
   - File: `backend/src/validators/groupAppointment.validators.js`
   - Validate:
     - Name, description, start/end times
     - Provider IDs array
     - Participant IDs array
     - Max participants > 0
     - End time > start time

6. **Frontend Integration** (2-3 hours)
   - File: `frontend/src/services/groupAppointmentService.js`
   - Connect wizard submit to backend
   - File: `frontend/src/pages/GroupBookingsPage.jsx`
   - Replace mock data with React Query
   - Add mutations for create/update/cancel

7. **Testing** (2-3 hours)
   - File: `backend/tests/integration/groupAppointments.test.js`
   - Test create with providers & participants
   - Test conflict detection
   - Test participant confirmation
   - Test cancellation
   - Test tenant isolation

**Acceptance Criteria:**
- [ ] Can create group appointment with multiple providers
- [ ] Can add participants to group appointment
- [ ] Provider availability conflicts detected
- [ ] Cannot double-book providers
- [ ] Participants can confirm/decline
- [ ] Can cancel group appointment
- [ ] All users notified (notifications stubbed)
- [ ] Frontend wizard submits successfully
- [ ] Group bookings appear in list

**Dependencies:**
- None (can start immediately)

**Blocks:**
- Group booking functionality
- Multi-provider scheduling

---

### Task 2.2: Dashboard Real Data

**Estimate:** 8-12 hours
**Assignee:** New Developer
**Priority:** MEDIUM (User value)

**Description:**
Connect dashboard to real backend data instead of showing mock metrics.

**Subtasks:**

1. **Backend Metrics API** (3-4 hours)
   - File: `backend/src/controllers/metrics.controller.js`
   - File: `backend/src/services/metrics.service.js`
   - File: `backend/src/routes/metrics.routes.js`
   - Endpoints:
     ```
     GET /api/v1/metrics/dashboard
       Query: { userId?, dateFrom?, dateTo? }
       Response: {
         appointments: { total, upcoming, today },
         waitlist: { active, promoted, cancelled },
         utilization: { percentage, trend },
         revenue: { total, trend }
       }
     ```
   - Metrics calculations:
     - Appointment counts (by status, date range)
     - Waitlist statistics
     - Provider utilization percentage
     - Trend calculations (vs previous period)

2. **Role-Specific Metrics** (2-3 hours)
   - Owner Dashboard:
     - Tenant-wide metrics
     - Revenue & billing
     - User activity
   - Admin Dashboard:
     - Team performance
     - Appointment distribution
     - Resource utilization
   - Provider Dashboard:
     - Personal appointment count
     - Today's schedule
     - Upcoming week
   - Client Dashboard:
     - My upcoming appointments
     - Booking history
     - Favorite providers

3. **Frontend Service** (1 hour)
   - File: `frontend/src/services/metricsService.js`
   - Functions:
     - `fetchDashboardMetrics()`
     - `fetchAppointmentMetrics()`
     - `fetchWaitlistMetrics()`

4. **Update Dashboard Page** (2-3 hours)
   - File: `frontend/src/pages/DashboardPage.jsx`
   - Replace mock data with React Query
   - Show different metrics based on user role
   - Add date range picker (optional)
   - Add refresh button
   - Auto-refresh every 5 minutes

5. **Testing** (1-2 hours)
   - Test metrics calculations are accurate
   - Test role-specific dashboards
   - Test date range filtering
   - Test real-time updates

**Acceptance Criteria:**
- [ ] Dashboard shows real appointment counts
- [ ] Waitlist metrics accurate
- [ ] Utilization percentage calculated correctly
- [ ] Each role sees appropriate metrics
- [ ] Metrics update automatically
- [ ] Date range filters work
- [ ] Loading states shown

**Dependencies:**
- Authentication UI (to test role-specific dashboards)

**Blocks:**
- User value (dashboard currently shows mock data)

---

## Priority 3: Quality & Testing 🧪

### Task 3.1: Test Coverage Improvement

**Estimate:** 8-12 hours
**Assignee:** New Developer + Claude Code
**Priority:** MEDIUM (CI/CD requirement)

**Description:**
Increase test coverage from 66.89% to 70%+ by adding tests for RBAC and waitlist edge cases.

**Subtasks:**

1. **RBAC Controller Tests** (3-4 hours)
   - File: `backend/tests/integration/rbac.test.js`
   - Test all 10 RBAC endpoints
   - Test permission checks
   - Test system role protection
   - Test tenant isolation
   - Test role assignment/removal

2. **RBAC Service Unit Tests** (2-3 hours)
   - File: `backend/tests/unit/rbac.service.test.js`
   - Test caching logic
   - Test permission checking (all, any modes)
   - Test cache invalidation
   - Mock Redis and database

3. **Waitlist Edge Cases** (2-3 hours)
   - Add to: `backend/tests/integration/waitlist.test.js`
   - Test duplicate prevention
   - Test validation errors
   - Test time window validation
   - Test tenant isolation
   - Test user status checks

4. **Frontend Component Tests** (2-3 hours)
   - File: `frontend/tests/components/PermissionGate.test.jsx`
   - Test permission modes (all, any)
   - Test legacy role fallback
   - Test loading states
   - Test fallback rendering

**Acceptance Criteria:**
- [ ] Backend coverage ≥ 70%
- [ ] RBAC code coverage ≥ 85%
- [ ] Waitlist coverage ≥ 80%
- [ ] Frontend unit tests for PermissionGate
- [ ] All edge cases covered

**Dependencies:**
- None (can start anytime)

**Blocks:**
- CI/CD coverage threshold
- Production confidence

---

### Task 3.2: E2E Testing with Playwright

**Estimate:** 8-12 hours
**Assignee:** New Developer + Claude Code
**Priority:** LOW (Nice to have)

**Description:**
Add end-to-end tests for critical user flows.

**Subtasks:**

1. **Setup Playwright** (1-2 hours)
   - Install Playwright
   - Configure test database
   - Add npm scripts

2. **Authentication Flow Tests** (2-3 hours)
   - Test login success
   - Test login failure
   - Test logout
   - Test protected route redirect

3. **Waitlist Flow Tests** (2-3 hours)
   - Test create entry
   - Test filter entries
   - Test promote entry
   - Test cancel entry

4. **RBAC Flow Tests** (2-3 hours)
   - Test create role
   - Test assign role
   - Test permission-based UI hiding

5. **Group Booking Flow Tests** (1-2 hours)
   - Test wizard navigation
   - Test form submission
   - Test validation errors

**Acceptance Criteria:**
- [ ] E2E tests pass locally
- [ ] Tests run in CI/CD
- [ ] Critical flows covered
- [ ] Tests are maintainable

---

## Priority 4: Lower Priority Features 📋

### Task 4.1: Appointment Booking Flow

**Estimate:** 16-20 hours
**Priority:** LOW
**Description:** Multi-step wizard for booking appointments

**Subtasks:**
- Create booking wizard component
- Provider search & filtering
- Availability search
- Time slot selection
- Confirmation step
- Backend integration
- Testing

**Can be deferred to Phase 3**

---

### Task 4.2: Audit Trail System

**Estimate:** 12-16 hours
**Priority:** LOW
**Description:** Track all changes for compliance

**Subtasks:**
- Audit log database schema
- Logging middleware
- API endpoints
- Frontend log viewer
- Filter & search
- Export functionality
- Testing

**Can be deferred to Phase 3**

---

### Task 4.3: Provider Dashboard

**Estimate:** 10-14 hours
**Priority:** LOW
**Description:** Provider-specific dashboard view

**Subtasks:**
- Today's schedule component
- Upcoming appointments widget
- Quick actions (cancel, reschedule)
- Calendar integration
- Performance metrics
- Testing

**Can be deferred to Phase 3**

---

### Task 4.4: Client Dashboard

**Estimate:** 8-12 hours
**Priority:** LOW
**Description:** Client-specific dashboard view

**Subtasks:**
- Upcoming appointments widget
- Book appointment CTA
- Booking history
- Favorite providers
- Testing

**Can be deferred to Phase 3**

---

### Task 4.5: Performance Optimization

**Estimate:** 6-10 hours
**Priority:** LOW
**Description:** Optimize bundle size and load times

**Subtasks:**
- Code splitting for admin routes
- Lazy loading components
- Image optimization
- Service Worker setup
- Lighthouse audit
- Performance testing

**Can be deferred to Phase 3**

---

## Summary & Timeline

### Critical Path (Must Complete for Phase 2)

| Task | Hours | Priority | Assignee |
|------|-------|----------|----------|
| 1.1 Authentication UI | 6-8 | 🚨 CRITICAL | New Dev |
| 1.2 RBAC Admin Modals | 6-10 | 🔥 HIGH | New Dev |
| 2.1 Group Booking Backend | 15-20 | 🔥 HIGH | New Dev + Claude |
| 2.2 Dashboard Real Data | 8-12 | ⚠️  MEDIUM | New Dev |
| 3.1 Test Coverage | 8-12 | ⚠️  MEDIUM | New Dev + Claude |
| **TOTAL** | **43-62 hours** | | |

### Optional (Can Defer to Phase 3)

| Task | Hours | Priority |
|------|-------|----------|
| 3.2 E2E Testing | 8-12 | LOW |
| 4.1 Appointment Booking | 16-20 | LOW |
| 4.2 Audit Trail | 12-16 | LOW |
| 4.3 Provider Dashboard | 10-14 | LOW |
| 4.4 Client Dashboard | 8-12 | LOW |
| 4.5 Performance Optimization | 6-10 | LOW |
| **TOTAL** | **60-84 hours** | |

### Recommended Timeline

**Week 1: Authentication + RBAC**
- Days 1-2: Authentication UI (6-8 hours)
- Days 3-4: RBAC Admin Modals (6-10 hours)
- Day 5: Testing & Polish (4-6 hours)

**Week 2: Group Bookings + Dashboard**
- Days 1-3: Group Booking Backend (15-20 hours)
- Days 4-5: Dashboard Real Data (8-12 hours)

**Week 3: Testing & Polish**
- Days 1-2: Test Coverage (8-12 hours)
- Days 3-5: Bug Fixes, E2E Tests, Documentation (16-20 hours)

**Phase 2 Complete:** End of Week 3

---

## Task Dependencies Graph

```
Authentication UI (1.1)
    ├─> Dashboard Real Data (2.2) [Can test role-specific dashboards]
    └─> E2E Tests (3.2) [Can test full user flows]

RBAC Admin Modals (1.2)
    └─> E2E Tests (3.2) [Can test role management]

Group Booking Backend (2.1)
    └─> E2E Tests (3.2) [Can test booking flow]

Dashboard Real Data (2.2)
    └─> (No dependencies)

Test Coverage (3.1)
    └─> (No dependencies, can start anytime)
```

**Critical Path:** 1.1 → 1.2 → 2.1 → 2.2 → 3.1

---

## Success Metrics

### Phase 2 Completion Criteria

- [x] RBAC foundation implemented ✅
- [x] System roles seeded ✅
- [x] Waitlist system complete ✅
- [x] Group booking wizard complete ✅
- [ ] Authentication UI complete
- [ ] RBAC admin UI complete
- [ ] Group booking backend complete
- [ ] Dashboard connected to real data
- [ ] Test coverage ≥ 70%
- [ ] All pages functional

**Current:** 6/10 criteria met (60%)
**Target:** 10/10 criteria met (100%)

### Quality Gates

Before marking Phase 2 complete:

- [ ] All backend tests passing
- [ ] Backend coverage ≥ 70%
- [ ] Frontend builds successfully
- [ ] No ESLint errors
- [ ] All critical features working
- [ ] Documentation updated
- [ ] Security review passed
- [ ] Performance acceptable (<2s page load)

---

## Risk Assessment

### High Risk Items

1. **Authentication Complexity**
   - Risk: Token refresh logic can be tricky
   - Mitigation: Follow existing JWT patterns, test thoroughly
   - Fallback: Use simple token-only auth initially

2. **Group Booking Conflicts**
   - Risk: Race conditions in provider booking
   - Mitigation: Use database transactions, advisory locks
   - Fallback: Simple conflict detection without auto-resolution

3. **Test Coverage Deadline**
   - Risk: May not reach 70% in time
   - Mitigation: Adjust threshold to 65% temporarily
   - Fallback: Waive requirement for Phase 2, target Phase 3

### Medium Risk Items

1. **Dashboard Metrics Complexity**
   - Risk: Complex SQL queries for metrics
   - Mitigation: Start simple, optimize later
   - Fallback: Use simpler metrics initially

2. **RBAC Admin UX**
   - Risk: Permission selection UI can be overwhelming
   - Mitigation: Group by resource, use search/filter
   - Fallback: Simple checkbox list

---

## Notes for New Developer

### What's Already Done (Don't Redo!)

- ✅ Backend RBAC is complete (just needs frontend modals)
- ✅ Waitlist is fully functional (reference this for patterns)
- ✅ Group booking wizard works (just needs backend)
- ✅ UI component library is complete
- ✅ Permission gating works perfectly
- ✅ All migrations up to date

### Where to Start

1. **Day 1:** Read this document + onboarding guide
2. **Day 2:** Implement authentication context
3. **Day 3:** Create login page & test
4. **Day 4:** Start RBAC modals
5. **Day 5:** Finish RBAC modals & test

### When You're Stuck

1. Look at `WaitlistPage.jsx` - it's the gold standard
2. Check the test files - they show API usage
3. Ask Claude Code - I have full context
4. Check documentation in `/docs`

### Communication

- Commit often with clear messages
- Update task status as you go
- Ask questions early
- Document decisions

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Phase:** 2 (75% complete)
**Remaining Work:** 43-62 hours (critical path)
