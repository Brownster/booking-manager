# Phase 1 Detailed Implementation Plan

> Reference: `docs/phase-1-strategy.md` (high-level). This document maps those workstreams to concrete implementation steps, file locations, and test coverage expectations. Tasks are ordered for sequential execution; each item completes before moving to the next unless noted.

---

## 0. Pre-flight Checks

1. **Environment parity**
   - Ensure `.env.example` includes `DATABASE_URL`, `DATABASE_TEST_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE`, `REFRESH_TOKEN_COOKIE_NAME`.
   - Docker Compose: verify services expose ports required for manual verification (`backend:3000`, `frontend:5173`, `postgres:5432`, `redis:6379`).
2. **Testing harness** (`backend/tests/setup.js`)
   - Implement test DB bootstrap: run migrations before tests, teardown afterwards using `TRUNCATE ... CASCADE` or transactions.
   - Share test helpers via `backend/tests/utils/db.js`.
3. **CI adjustments**
   - Update GitHub Actions workflow (when present) to run `npm run test` and `npm run lint` for backend + frontend once implemented.

---

## 1. Database & Migrations (Backend)

### 1.1 Migration Framework

- Create directory structure:
  ```
  backend/src/config/migrations/
    ├── migrate.js
    ├── seed.js
    └── sql/
        ├── 0001_create_users.sql
        ├── 0002_create_skills.sql
        ├── 0003_create_calendars.sql
        ├── 0004_create_availability_slots.sql
        ├── 0005_create_appointments.sql
        └── 0006_create_tokens_blacklist.sql
  ```
- `migrate.js`:
  - Reads SQL files in order, executes via `pg` pool.
  - Idempotent using a `_migrations` table to track applied migrations.
  - Expose functions `applyMigrations()` and `rollbackLastMigration()` (for testing support).
- `seed.js`:
  - Optional seeding for local dev (admin user, sample calendar). Use transaction wrapper.

### 1.2 Table Definitions

1. `users`
   - Columns: `id UUID PK DEFAULT gen_random_uuid()`, `tenant_id UUID NOT NULL`, `email CITEXT NOT NULL`, `password_hash TEXT NOT NULL`, `first_name`, `last_name`, `role VARCHAR(50)`, `status VARCHAR(20) DEFAULT 'active'`, `email_verified BOOLEAN DEFAULT FALSE`, timestamps.
   - Constraints: `UNIQUE(email, tenant_id)`, `CHECK(status IN ('active','inactive','suspended'))`.
   - Indexes: `(tenant_id)`, `(email, tenant_id)`, `(role)`.
2. `skills`
   - Columns: `id`, `tenant_id`, `name`, `category`, `description`, timestamps.
   - Constraint: `UNIQUE(tenant_id, name)`.
3. `calendars`
   - Columns: `id`, `tenant_id`, `provider_user_id REFERENCES users(id)`, `service_type`, `timezone`, `is_active BOOLEAN DEFAULT TRUE`, timestamps.
   - Validate timezone at application level; add index on `(tenant_id, provider_user_id)`.
4. `availability_slots` (recurring)
   - Columns: `id`, `calendar_id REFERENCES calendars`, `day_of_week SMALLINT`, `start_time TIME`, `end_time TIME`, `capacity SMALLINT DEFAULT 1`, `metadata JSONB`, timestamps.
   - Check constraints for `0 <= day_of_week <= 6`, `end_time > start_time`, `capacity >= 1`.
5. `appointments`
   - Columns: `id`, `tenant_id`, `calendar_id`, `client_user_id`, `start_time TIMESTAMPTZ`, `end_time TIMESTAMPTZ`, `status`, `required_skills UUID[]`, `notes`, timestamps.
   - Constraint: `CHECK(status IN ('pending','confirmed','completed','cancelled'))`.
   - Index on `(calendar_id, start_time, end_time)`.
6. `token_blacklist`
   - Columns: `id`, `token`, `expires_at`.
   - Index on `token` for quick lookups.

**Testing hook:** Add `backend/tests/utils/resetDb.js` to drop/truncate tables between tests.

---

## 2. Backend Architecture Enhancements

### 2.1 Directory Layout

```
backend/src/
  ├── app.js                 # Express app (split from index for testing)
  ├── index.js               # Server bootstrap
  ├── routes/
  │   ├── auth.routes.js
  │   ├── skills.routes.js
  │   ├── calendars.routes.js
  │   ├── availability.routes.js
  │   └── appointments.routes.js
  ├── controllers/
  │   ├── auth.controller.js
  │   └── ...
  ├── services/
  │   ├── auth.service.js
  │   ├── token.service.js
  │   ├── skill.service.js
  │   ├── calendar.service.js
  │   ├── availability.service.js
  │   └── appointment.service.js
  ├── repositories/
  │   ├── user.repository.js
  │   ├── skill.repository.js
  │   ├── calendar.repository.js
  │   ├── availability.repository.js
  │   └── appointment.repository.js
  ├── middleware/
  │   ├── auth.middleware.js
  │   ├── role.middleware.js
  │   └── rate-limit.middleware.js
  ├── utils/
  │   ├── validation.js
  │   ├── error.js
  │   ├── password.js
  │   ├── jwt.js
  │   └── timezone.js
  └── config/
      ├── database.js
      ├── redis.js
      └── logger.js
```

### 2.2 Shared Utilities

- `utils/password.js`: wraps bcrypt hash/compare with configurable rounds.
- `utils/jwt.js`: issueAccessToken, issueRefreshToken, verifyToken (with issuer/audience validation).
- `utils/error.js`: Custom Error classes (e.g., `ApiError`, `ValidationError`, `AuthError`).
- `utils/validation.js`: Express-validator schemas for each endpoint.
- `utils/timezone.js`: wrappers using `moment-timezone` for conversions, DST handling.

**Testing:** Ensure each utility has dedicated unit tests (`backend/tests/unit/utils/*.test.js`).

### 2.3 Error Handling & Logging

- Centralize async controller error handling with wrapper (e.g., `asyncHandler`).
- Extend logger usage in services for key events (`user_created`, `login_failed`, `slot_query_duration`).
- Ensure production errors do not leak details; rely on `ApiError`.

---

## 3. Backend Feature Implementation Sequence

### 3.1 Identity & Authentication

1. **User repository/service**
   - Repository: `getByEmail`, `createUser`, `getById`, `updateStatus`, `listByTenant`.
   - Service: orchestrates hashing, validation, and triggers events (future use).
2. **Token service**
   - Methods: `generateTokens(user)`, `verifyAccessToken`, `verifyRefreshToken`, `revokeToken`, `isTokenRevoked`.
   - Store revoked refresh tokens in Redis (`setEx`) and DB fallback (`token_blacklist`).
3. **Auth controller/routes**
   - Implement endpoints; ensure register/login return sanitized user DTO (omit password).
   - Use `express-validator` for payload.
4. **Middleware**
   - `authenticate`: extracts JWT from `Authorization` header or cookie.
   - `authorize(roles)`: ensures user role matches.
   - Rate limiters: new file `middleware/rate-limit.middleware.js`.
5. **Tests**
   - Unit: password & jwt utils, repositories (mock db), services (mock repo).
   - Integration: supertest hitting `/api/v1/auth` using test DB, verifying status codes.
   - E2E (later with frontend) but backend integration must be green before moving on.

### 3.2 Core Data Models & CRUD

**Execution order:** Skills → Calendars → Availability Slots → Appointments.

1. **Skills**
   - Repository: `createSkill`, `getSkillsByTenant`, `updateSkill`, `deleteSkill`.
   - Service: enforce uniqueness, attach audit info.
   - Controller/routes: `/api/v1/skills`.
   - Tests: unit for validation, integration for endpoints (auth required, admin role).
2. **Calendars**
   - Ensure provider user belongs to same tenant and is active.
   - Validate timezone; add service method `toggleActive`.
   - Tests: integration verifying invalid timezone, cross-tenant access.
3. **Availability Slots**
   - Support CRUD; ensure no overlapping slots for same day/time combination by checking existing entries.
   - Provide service method `listSlotsByCalendar`.
4. **Appointments**
   - Create appointment with validations: start < end, minimum duration, user active.
   - Conflict detection: call `availability.service.isSlotFree`.
   - Cancel/update endpoints.
5. **Tests**
   - Comprehensive integration tests for each entity (including error cases).
   - Unit tests on conflict detection helpers.

### 3.3 Availability Search Algorithm

1. **Data preparation**
   - Define repository methods to fetch:
     - Active calendars with required skills.
     - Existing appointments in date range.
     - Availability slots for relevant days.
2. **Service implementation**
   - Input DTO validation (schema via express-validator).
   - Normalize requested date range to tenant timezone.
   - Generate candidate slots by iterating through availability, adjust for capacity.
   - Filter conflicts using `appointments`.
   - Cache results in Redis keyed by `tenant:skills:dateRange`.
3. **API endpoint**
   - `GET /api/v1/availability/search` with query params: `tenantId`, `skills=[]`, `start`, `end`, `duration`.
   - Return array of slots with calendar/provider info.
4. **Logging/metrics**
   - Log search duration, result count.
5. **Tests**
   - Unit: timezone conversions, conflict detection, skill matching (AND/OR).
   - Integration: hitting search endpoint with seeded data.
   - Performance smoke: add Jest test measuring response under seeded 1k slots (skip in CI if necessary using `describe('performance', () => { ... })` with `process.env.RUN_PERF_TESTS` gate).

---

## 4. Frontend Implementation Plan

### 4.1 Setup & Architecture

1. Add tooling:
   - Install `react-router-dom`, `axios`, `zustand` (for state), `@tanstack/react-query` (optional).
   - Configure absolute imports via `vite.config.js`.
2. Directory structure:
   ```
   frontend/src/
     ├── api/
     │   ├── client.js
     │   └── auth.api.js
     ├── components/
     │   ├── forms/
     │   ├── layout/
     │   └── availability/
     ├── context/
     │   └── AuthProvider.jsx
     ├── hooks/
     │   ├── useAuth.js
     │   └── useAvailabilitySearch.js
     ├── pages/
     │   ├── Auth/
     │   ├── Dashboard/
     │   ├── Skills/
     │   ├── Calendars/
     │   └── Booking/
     ├── router/
     │   └── index.jsx
     └── utils/
         ├── formatters.js
         └── validators.js
   ```

3. State management:
   - `AuthProvider` handles access token storage (memory + localStorage sync) and refresh flow.
   - Protected routes wrapper to ensure authentication.

### 4.2 Feature Sequence

1. **Auth Flows**
   - Pages: `Login`, `Register`.
   - Hook `useAuth` for login/logout/me.
   - Ensure tokens handled securely (refresh via httpOnly cookie; access token stored in memory + fallback to secure storage).
   - Tests: Vitest unit tests for hooks/components; E2E for login/register via Playwright stub (once backend ready).
2. **Admin Dashboard**
   - Basic dashboard page listing skills and calendars.
   - CRUD UI components with form validation mirroring backend rules.
3. **Availability Search UI**
   - Search form (skill filter, date range, duration).
   - Result list with provider/time info.
   - Booking form creating appointment.
4. **Styling & UX**
   - Use CSS modules or Tailwind (decision: stick with CSS modules for now).
5. **Testing**
   - Component tests for forms (validation).
   - Integration tests using Testing Library + MSW to mock API.
   - E2E: Playwright tests (login, create skill, run availability search, book appointment).

---

## 5. Quality Gates & Tooling

1. **Linting/Formatting**
   - Extend ESLint config to include new directories.
   - Pre-commit hook suggestion (Husky) – optional for Phase 1 but recommended.
2. **Commit Guidelines**
   - Conventional commits for traceability (e.g., `feat(auth): add login endpoint`).
3. **Documentation**
   - Update README with new scripts/endpoints.
   - API reference stub: `docs/api/auth.md`, `docs/api/skills.md`, etc. (create once endpoints stable).
4. **Monitoring hooks**
   - Prepare to integrate metrics (log durations). For now, ensure logs include correlation IDs (use middleware to generate `req.id`).

---

## 6. Milestone Checklist (Definition of Done)

| Milestone | Key Outputs | Tests | Docs |
|-----------|-------------|-------|------|
| Auth Complete | migrations 0001, user repo/service, auth routes, middleware, rate limits | unit (utils/services), integration (auth routes) | README update, `docs/api/auth.md` |
| Skills/Calendars | migrations 0002–0004, repositories/services/controllers, validation | unit + integration tests, seed factories | `docs/api/skills.md`, `docs/api/calendars.md` |
| Availability Search | migration 0005, availability+appointment modules, search endpoint, caching | unit (timezone/conflict), integration (search), performance smoke | `docs/api/availability.md` |
| Frontend Flows | Auth pages, admin CRUD, search & booking UI, shared hooks | Vitest component tests, Playwright E2E (REG-001) | Frontend README section |
| Hardening | Redis token blacklist, CI updates, logging enhancements | Full suite green in CI | Changelog entries |

Each milestone requires: code review, passing tests (`npm run test`, `npm run lint` backend/frontend), docs updated, and deployment smoke test via Docker compose.

---

## 7. Outstanding Questions / Dependencies

- Email verification (out of scope for Phase 1?) – flagged for product decision.
- Tenant provisioning – assume tenants pre-loaded via seeds; future automation needed.
- Notification system integration deferred to later phases.
- Performance budget for search API (target < 300ms for 80th percentile with 100 calendars) – collect metrics once algorithm implemented.

---

## 8. Execution Timeline (Sequential Steps)

1. Implement migration framework + run initial schema migrations.
2. Build backend auth utilities, repositories, services, controllers, middleware, tests.
3. Implement skills/calendars/slots/appointments backend modules + tests.
4. Implement availability search algorithm + caching + tests.
5. Build frontend auth flows + tests.
6. Build frontend admin CRUD & availability views + tests.
7. Integrate booking flow (frontend→backend) + E2E tests.
8. Finalize documentation, update CI, run full suite.

Progression to next step occurs only after current step’s acceptance criteria and tests pass.
