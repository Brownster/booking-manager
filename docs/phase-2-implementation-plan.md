# Phase 2 Execution Plan — RBAC & Advanced Features

> Builds on Phase 1 foundations. Objectives: enterprise-grade role-based access control, advanced booking workflows, and operational observability while maintaining modular, DRY architecture and comprehensive automated testing.

---

## 0. Pre-flight Checklist

1. **Dependencies**
   - Confirm Postgres migrations applied through Phase 1.
   - Ensure Redis running for caching/token blacklist.
   - Introduce any new libraries (e.g., access-control helpers) with threat modelling review.
2. **Environment Variables**
   - Add `RBAC_DEFAULT_ROLE`, `AUDIT_LOG_LEVEL`, `FEATURE_FLAG_*` to `.env.example`.
   - Provide test-specific overrides where needed.
3. **Documentation Baseline**
   - Snapshot current API docs.
   - Update architectural diagram with RBAC module placements.

---

## 1. RBAC Core (Weeks 6-7)

### 1.1 Role & Permission Model
- **Schema**
  - Tables: `roles`, `permissions`, `role_permissions`, `user_roles`.
  - Default roles: `owner`, `admin`, `provider`, `client`, `support`.
  - Support tenant-level scoping (`tenant_id` columns, CASCADE deletes).
- **Repositories**
  - `role.repository.js`, `permission.repository.js`.
- **Services**
  - `rbac.service.js` managing inheritance, permission lookup, caching.
- **Caching**
  - Redis namespace `rbac:tenant:{id}:user:{id}` for resolved permissions with TTL + invalidation hooks.

### 1.2 Policy Enforcement Layer
- **Middleware**
  - `authorizePermissions(requiredPermissions)` checking cached/resolved set.
  - `ownershipGuard` factory verifying resource ownership (calendar, appointment).
- **Integration**
  - Wrap existing routes (skills, calendars, availability, appointments) with permission checks.
  - Expose `GET /api/v1/rbac/permissions` for introspection (admin-only).

### 1.3 Testing
- **Unit**
  - Permission resolution, inheritance, cache invalidation.
- **Integration**
  - Route-level enforcement scenarios (allowed/denied).
  - Tenant boundary tests.
- **Security Tests**
  - Attempt privilege escalation (e.g., provider creating admin role).

---

## 2. Advanced Booking Workflows (Weeks 7-8)

### 2.1 Group & Multi-Provider Scheduling
- **Schema**
  - `group_appointments` table linking multiple calendars/users.
  - `appointment_participants` join table.
- **Services**
  - `groupBooking.service.js` orchestrating slot aggregation + capacity checks.
- **API**
  - `POST /api/v1/appointments/group` with participant list, fallback to individual bookings on failure.
- **Validation**
  - Ensure all participants share tenant + relevant skills.
  - Enforce max group size (configurable).

### 2.2 Waitlist & Auto-Reassignment
- **Schema Additions**
  - `waitlist_entries` table with status, priority, desired time window.
- **Services**
  - `waitlist.service.js` hooking into appointment cancellation events.
  - Enqueue logic when no slots available; auto-book when slots open.
- **Event System**
  - Introduce lightweight domain events (e.g., `appointment.cancelled`) dispatched via in-memory bus (Phase 2) with planned Kafka/SQS adapter (Phase 3).

### 2.3 Notifications Stub (Backend Ready)
- **Interfaces**
  - `notification.service.js` with driver pattern (email/SMS/Slack).
  - Phase 2: log-based driver; Phase 3: integrate actual providers.
- **Trigger Points**
  - Booking confirmations, cancellations, waitlist promotions.

### 2.4 Testing
- **Unit**
  - Group availability computation, waitlist prioritization.
- **Integration**
  - Happy-path + conflict scenarios for group bookings.
  - Waitlist promotion when slot freed.
- **Contract Tests**
  - Notification service interface with mocked drivers.

---

## 3. Audit Trail & Observability (Week 8)

### 3.1 Audit Logging
- **Schema**
  - `audit_logs` table capturing actor, action, resource, metadata, timestamp.
- **Middleware**
  - `auditLogger` decorating request lifecycle (post-success only).
- **Service**
  - `audit.service.js` with batching (optional), log rotation strategy.

### 3.2 Metrics & Health Enhancements
- **Expose**
  - `/metrics` endpoint (Prometheus format) with auth guard.
  - Collect counters: bookings created, cancellations, waitlist promotions.
- **Logging**
  - Extend Winston transports for structured audit output.

### 3.3 Testing
- **Unit**
  - Audit service formatting, redact sensitive fields.
- **Integration**
  - Ensure critical endpoints emit audit entries.
  - Validate metrics increments via supertest (mock Prometheus registry).

---

## 4. Frontend Enhancements (Weeks 8-9)

### 4.1 Role-Aware UX
- **Routing**
  - Protect routes with RBAC guard (React context + hook).
  - Display features based on permissions (e.g., admin dashboards, waitlist view).
- **Components**
  - Role management UI (assign roles, view permissions).
  - Waitlist management panel.
  - Group booking flow (participant selector, availability overlay).

### 4.2 State & Data Fetching
- **Enhancements**
  - Integrate React Query for caching RBAC/availability data.
  - Centralized API client handling 401/403 with re-auth workflow.

### 4.3 Testing
- **Unit**
  - Hooks: `usePermissions`, `useWaitlist`.
- **Component**
  - Role-based rendering, group booking wizard.
- **E2E**
  - Cypress/Playwright flows: admin role change, group booking, waitlist promotion.

---

## 5. Tooling & Quality Gates

1. **Migrations**
   - Add `backend/src/config/migrations/sql/0007_*` onwards with down scripts.
   - Update migration README with Phase 2 philosophy.
2. **Lint & Format**
   - Extend lint rules to new directories (`rbac`, `notifications`, etc.).
3. **Testing Pipeline**
   - Ensure `npm run test -- --runInBand` covers integration suites in CI (services via Docker compose).
   - Add coverage thresholds for new modules (≥80%).
4. **Security**
   - Run `npm audit` and dependency review before Phase 2 sign-off.
   - Threat model RBAC workflows (document in `docs/security/rbac-threat-model.md`).

---

## 6. Milestones & Exit Criteria

| Milestone | Key Deliverables | Acceptance Tests | Owner |
|-----------|------------------|------------------|-------|
| RBAC Core | Roles/permissions tables, middleware, caching | Unit + integration RBAC suites passing | Backend |
| Advanced Booking | Group bookings, waitlist, notification stubs | Integration tests, E2E for group flow | Backend + Frontend |
| Audit & Metrics | Audit log service, `/metrics` endpoint | Audit integration tests, metric validation | Backend |
| Frontend RBAC | Role-aware navigation, waitlist UI | Vitest component tests, Playwright paths | Frontend |
| Quality Gate | CI green (lint, tests), docs updated | Manual review + ✅ checklist | Team |

---

## 7. Risk Register & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Permission drift between backend & frontend | Medium | High | Derive frontend permission map from backend endpoint (`/rbac/permissions`) |
| Waitlist auto-booking race conditions | Medium | High | Use Postgres advisory locks or `FOR UPDATE SKIP LOCKED` when promoting entries |
| Audit log volume growth | Medium | Medium | Partition table by month, archive job (Phase 3) |
| Test flakiness due to concurrent Redis connections | Low | Medium | Reuse Redis client, isolate keys per test tenant |

---

## 8. Definition of Done (Per Feature)

1. Code merged with review approval.
2. Unit + integration tests implemented and passing (frontend components included).
3. Coverage ≥80% for new modules or documented rationale.
4. Migrations applied + rollback verified locally.
5. API docs & changelog updated.
6. Security/privacy review notes captured (especially for RBAC and audit logging).

---

## 9. Next Actions

1. Create ticket backlog aligned with milestones above (tag `PH2-*`).
2. Draft migration scripts for RBAC tables (`0007_` series).
3. Spike RBAC permission caching strategy (Redis keys & invalidation).
4. Update `README.md` roadmap section to include Phase 2 highlights.

