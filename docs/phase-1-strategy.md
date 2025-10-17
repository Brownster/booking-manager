# Phase 1 Implementation Strategy

## Objective

Deliver the MVP-ready authentication layer, core domain data models, and availability search stack described in the roadmap, ensuring each capability ships with end-to-end validation, observability hooks, and developer ergonomics that keep the codebase DRY, maintainable, and well documented.

<!-- COMMENT: This aligns perfectly with Phase 1 roadmap objectives (Weeks 2-5).
     Consider: Add explicit success metrics (e.g., "Phase 1 complete when all 5 workstreams
     meet DoD + REG-001 baseline test passes") -->

## Guiding Principles

- Build features behind clear modules (`controllers → services → repositories`) to preserve separation of concerns and enable unit/integration coverage at each layer.
- Treat tests as first-class citizens: every story lands with unit, integration, and—where called out—E2E coverage plus factory-driven seeded data.
- Keep infrastructure parity between local, CI, and container environments to prevent drift.
- Document decisions inline (succinct comments) and in `docs/` for onboarding continuity.

## Workstreams & Milestones

### 1. Identity & Authentication (Week 2 focus)

<!-- COMMENT: Critical foundation for multi-tenant system. All subsequent features depend on this. -->

- **Schema**: SQL migration for `users` table (email unique per tenant, password_hash, role, status, tenant_id FK, timestamps).
  <!-- ✓ GOOD: Composite unique constraint (email, tenant_id) allows same email across tenants
       ✓ GOOD: Separate password_hash field (never store plaintext)
       TODO: Add indexes: CREATE INDEX idx_users_email_tenant ON users(email, tenant_id);
       TODO: Add indexes: CREATE INDEX idx_users_tenant ON users(tenant_id);
       TODO: Consider: first_name, last_name fields per roadmap Week 2 spec
       TODO: Consider: email_verified boolean for future email verification
       TODO: Status enum should be: 'active', 'inactive', 'suspended' -->
- **Service Layer**: Auth service handling registration, login, logout, token refresh, password hashing (bcrypt ≥ 12 rounds), JWT issuance/verification.
  <!-- ✓ EXCELLENT: bcrypt ≥ 12 rounds matches roadmap security requirements
       Implementation notes:
       - Use bcrypt.hash(password, 12) for registration
       - JWT payload MUST include: { userId, tenantId, role, iat, exp }
       - Access token: 1h expiry, Refresh token: 7d expiry (.env.example configured)
       - Store revoked tokens in Redis with TTL = token expiry for logout
       Security consideration: Implement token rotation on refresh (issue new refresh token)
       Reference: backend/src/config/redis.js:39 for cache helpers -->

- **HTTP Layer**: Routes under `/api/v1/auth`; middleware for protected routes (`requireAuth`, `requireRole` scaffolding).
  <!-- Required endpoints per roadmap Section 4.1:
       POST /api/v1/auth/register - Create new user (returns 201, user object, tokens)
       POST /api/v1/auth/login    - Authenticate user (returns 200, user object, tokens)
       POST /api/v1/auth/logout   - Revoke tokens (returns 200)
       POST /api/v1/auth/refresh  - Exchange refresh token for new access token
       GET  /api/v1/auth/me       - Get current user info (protected route)

       Middleware architecture:
       - requireAuth: Validate JWT → extract user → attach to req.user
       - requireRole(['admin', 'supervisor']): Check req.user.role (Phase 2 RBAC prep)
       - Middleware order: helmet → cors → rateLimit → auth → routes -->

- **Security Hardening**: Rate limiting on login, secure cookie support for refresh tokens, centralized error handling with sanitized responses.
  <!-- CRITICAL security measures:
       1. Rate limiting (express-rate-limit):
          - Login: 5 attempts per 15 min per IP
          - Register: 3 attempts per hour per IP
          - Refresh: 10 attempts per 15 min per IP

       2. Refresh token storage:
          - httpOnly: true (prevents XSS access)
          - secure: true (HTTPS only in production)
          - sameSite: 'strict' (CSRF protection)
          - maxAge: 7 days

       3. Error sanitization:
          - NEVER leak "user exists" vs "wrong password"
          - Generic: "Invalid email or password"
          - No stack traces in production
          - Log detailed errors server-side only

       4. Additional hardening:
          - Helmet middleware (already in backend/src/index.js:15)
          - CORS whitelist (configured in .env CORS_ORIGIN)
          - Input validation with express-validator
          - Password complexity: min 8 chars, 1 upper, 1 lower, 1 number -->
- **Testing**:
  - Unit tests for hashing/JWT utilities.
  - Integration tests for auth endpoints (happy path, invalid credentials, revoked token).
  - E2E login/regression flow (frontend interacting with API).
  <!-- Test coverage requirements (roadmap Phase 1, Week 2):
       UNIT TESTS (backend/tests/unit/auth/):
       - bcrypt hashing: correct rounds, salts unique, compare validates
       - JWT generation: correct payload structure, expiry, signature
       - JWT validation: expired tokens fail, malformed tokens fail, valid tokens pass
       - Password validation: complexity rules enforced
       Target: 100% coverage on auth utilities

       INTEGRATION TESTS (backend/tests/integration/auth/):
       - POST /register: 201 success, 409 duplicate email, 400 invalid input
       - POST /login: 200 success, 401 wrong password, 401 non-existent user
       - POST /logout: 200 success, token blacklisted in Redis
       - POST /refresh: 200 new tokens, 401 invalid refresh token
       - GET /me: 200 with valid token, 401 without token, 401 with expired token
       Target: All endpoints + edge cases

       E2E TESTS (frontend or Playwright):
       - Complete flow: register → login → access dashboard → logout → verify redirect to login
       - Token refresh: wait for token expiry → API call → auto-refresh → success
       Reference: Roadmap REG-001 baseline test (Phase 2) -->

### 2. Core Domain Models & CRUD (Weeks 2-3)

<!-- COMMENT: Foundation data models for booking system. Critical that relationships are correct. -->

- **Schema**:
  - `skills` (name, category, description, tenant_id, unique constraint).
    <!-- TABLE: skills
         Columns:
         - id: UUID PRIMARY KEY
         - name: VARCHAR(100) NOT NULL
         - category: VARCHAR(50) (e.g., 'plumbing', 'electrical', 'carpentry')
         - description: TEXT
         - tenant_id: UUID NOT NULL REFERENCES tenants(id)
         - created_at, updated_at: TIMESTAMP
         Constraints:
         - UNIQUE (tenant_id, name) - prevents duplicate skills within tenant
         Indexes:
         - CREATE INDEX idx_skills_tenant ON skills(tenant_id);
         - CREATE INDEX idx_skills_category ON skills(category);
         Roadmap ref: Week 3, Section 4.2 -->

  - `calendars` (provider_user_id FK → users, service_type, timezone, is_active).
    <!-- TABLE: calendars
         Columns:
         - id: UUID PRIMARY KEY
         - provider_user_id: UUID NOT NULL REFERENCES users(id)
         - service_type: VARCHAR(100) (e.g., 'plumbing_repair', 'electrical_install')
         - timezone: VARCHAR(50) NOT NULL (IANA timezone, e.g., 'America/New_York')
         - is_active: BOOLEAN DEFAULT true
         - created_at, updated_at: TIMESTAMP
         Validation:
         - timezone MUST be valid IANA timezone (validate against moment-timezone.tz.names())
         - One user can have multiple calendars (different service types)
         Indexes:
         - CREATE INDEX idx_calendars_provider ON calendars(provider_user_id);
         - CREATE INDEX idx_calendars_active ON calendars(is_active) WHERE is_active = true;
         Roadmap ref: Week 3, Section 4.3 -->

  - `availability_slots` (calendar_id, start_at, end_at, capacity, metadata).
    <!-- TABLE: availability_slots
         Columns:
         - id: UUID PRIMARY KEY
         - calendar_id: UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE
         - day_of_week: INTEGER (0=Sunday, 6=Saturday) for recurring slots
         - start_time: TIME NOT NULL (e.g., '09:00:00')
         - end_time: TIME NOT NULL (e.g., '17:00:00')
         - capacity: INTEGER DEFAULT 1 (concurrent appointments allowed)
         - metadata: JSONB (future: breaks, special rules)
         - created_at, updated_at: TIMESTAMP
         Constraints:
         - CHECK (end_time > start_time)
         - CHECK (capacity >= 1)
         Usage: Represents recurring weekly availability (e.g., "Mondays 9am-5pm")
         Indexes:
         - CREATE INDEX idx_availability_calendar ON availability_slots(calendar_id);
         - CREATE INDEX idx_availability_day ON availability_slots(day_of_week);
         CRITICAL: This is for RECURRING slots. Actual slot generation happens at query time.
         Roadmap ref: Week 3-4, Section 4.4 -->

  - `appointments` (calendar_id, user_id, status enum, skill requirements, notes).
    <!-- TABLE: appointments
         Columns:
         - id: UUID PRIMARY KEY
         - calendar_id: UUID NOT NULL REFERENCES calendars(id)
         - client_user_id: UUID NOT NULL REFERENCES users(id) (who booked it)
         - start_time: TIMESTAMPTZ NOT NULL
         - end_time: TIMESTAMPTZ NOT NULL
         - status: VARCHAR(20) NOT NULL DEFAULT 'pending'
           (enum: 'pending', 'confirmed', 'completed', 'cancelled')
         - required_skills: UUID[] (array of skill IDs)
         - notes: TEXT
         - created_at, updated_at: TIMESTAMP
         Constraints:
         - CHECK (end_time > start_time)
         - CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
         Business rules:
         - Only 'confirmed' appointments block calendar slots
         - 'cancelled' appointments don't block slots
         - Minimum duration: 15 minutes (enforced in service layer)
         Indexes (CRITICAL for performance):
         - CREATE INDEX idx_appointments_calendar_time ON appointments(calendar_id, start_time, end_time);
         - CREATE INDEX idx_appointments_status ON appointments(status);
         - CREATE INDEX idx_appointments_client ON appointments(client_user_id);
         Roadmap ref: Week 3, Section 4.6 - Phase 2 Week 7-8 for conflict detection -->
- **Services & Controllers**:
  - CRUD interfaces with validation (timezone via IANA list, slot overlaps prevented at write layer).
  - Repository helpers encapsulating SQL queries (via `db` module) for reuse.
- **Frontend**: Minimal forms/tables to interact with CRUD endpoints (base UI for admin flows).
- **Testing**:
  - Unit: model validators, service business rules (uniqueness, referential checks).
  - Integration: supertest coverage for each CRUD route, validation error cases.
  - Seed factories: extend test factories to cover new entities (leveraging Faker).

### 3. Availability Search Algorithm (Weeks 3-5) ⭐ **CRITICAL PATH**

<!-- COMMENT: This is the core business logic. Most complex part of Phase 1.
     Roadmap emphasizes: 80%+ test coverage required, cache-ready design for Phase 3.
     Performance target: p95 < 200ms (Phase 3 requirement, baseline here) -->

- **Algorithm Design**:
  - Inputs: tenant context, desired skill(s), date range, optional constraints (duration, timezone).
    <!-- Input structure (POST /api/v1/search/availability):
         {
           "tenantId": "uuid",              // From JWT token
           "requiredSkills": ["uuid1", "uuid2"],  // AND logic: must have ALL skills
           "dateRange": {
             "start": "2024-01-15",
             "end": "2024-01-22"
           },
           "duration": 60,                  // Minutes (default: 60)
           "timezone": "America/New_York",  // Client timezone for results
           "proficiencyLevel": "INTERMEDIATE" // Optional: BASIC/INTERMEDIATE/ADVANCED/EXPERT
         }
         Validation:
         - dateRange max 30 days (prevent expensive queries)
         - duration min 15 min, max 480 min (8 hours)
         - requiredSkills array not empty (at least 1 skill) -->

  - Processing: query availability slots, filter by skill match and conflict-free windows, account for timezone conversions, enforce minimum granularity.
    <!-- Processing pipeline (5 stages):
         1. Skill Match: Find calendars with ALL required skills via calendar_skills join
         2. Availability Generation: Expand recurring slots into actual time windows for date range
         3. Conflict Detection: Filter out time windows with confirmed appointments
         4. Timezone Conversion: Convert from calendar timezone to requested timezone
         5. Ranking: Sort by earliest available, provider rating (Phase 2), utilization

         Performance considerations:
         - Stage 1: Use index on calendar_skills(skill_id, calendar_id)
         - Stage 2: Generate slots in-memory (don't materialize to DB)
         - Stage 3: Use index on appointments(calendar_id, start_time, end_time)
         - Stage 4: Use moment-timezone for IANA timezone conversion
         - Stage 5: Limit results to top 50 slots (pagination in Phase 2) -->

  - Output: ranked list of available slots with provider metadata.
    <!-- Output structure:
         {
           "slots": [
             {
               "calendarId": "uuid",
               "providerId": "uuid",
               "providerName": "John Doe",
               "skills": ["Plumbing", "Leak Repair"],
               "startTime": "2024-01-15T09:00:00-05:00",  // In requested timezone
               "endTime": "2024-01-15T10:00:00-05:00",
               "duration": 60,
               "available": true
             }
           ],
           "totalResults": 47,
           "searchDuration": "142ms"  // For monitoring
         }
         Roadmap ref: Section 4.5 search API schema -->
- **Implementation Steps**:
  1. Repository query for candidate calendars/slots with skill mapping.
     <!-- Step 1 Implementation (backend/src/services/availability.service.js):
          Function: getCalendarsWithSkills(tenantId, requiredSkillIds)
          SQL Query:
          SELECT c.id, c.provider_user_id, c.timezone, c.service_type
          FROM calendars c
          WHERE c.tenant_id = $1
            AND c.is_active = true
            AND (
              SELECT COUNT(DISTINCT cs.skill_id)
              FROM calendar_skills cs
              WHERE cs.calendar_id = c.id
                AND cs.skill_id = ANY($2)
            ) = $3  -- $3 = length of requiredSkillIds (ensures ALL skills present)

          This enforces AND logic: calendar must have ALL required skills
          Returns: Array of calendar objects with provider info
          Test cases: 0 skills match, 1 skill matches, all skills match, partial match (fail) -->

  2. Conflict detection against existing appointments (status-aware).
     <!-- Step 2 Implementation (backend/src/services/availability.service.js):
          Function: isFree(calendarId, startTime, endTime)
          SQL Query:
          SELECT COUNT(*) FROM appointments
          WHERE calendar_id = $1
            AND status = 'confirmed'  -- Only confirmed appointments block slots
            AND (
              (start_time <= $2 AND end_time > $2) OR  -- Overlaps start
              (start_time < $3 AND end_time >= $3) OR  -- Overlaps end
              (start_time >= $2 AND end_time <= $3)    -- Contained within
            )

          Returns: boolean (true if no conflicts, false if conflicts exist)
          CRITICAL: Only 'confirmed' status blocks. 'pending', 'cancelled' ignored.
          Edge cases to test:
          - Exact time match (9:00-10:00 vs 9:00-10:00) → conflict
          - Adjacent slots (9:00-10:00 vs 10:00-11:00) → no conflict
          - 1-minute overlap (9:00-10:00 vs 9:59-11:00) → conflict
          - Daylight saving time transitions
          Roadmap ref: Phase 1 Week 3-4, Phase 2 Week 7-8 for conflict prevention -->

  3. Timezone normalization utilities (moment-timezone or luxon).
     <!-- Step 3 Implementation (backend/src/utils/timezone.js):
          Use moment-timezone library (already in package.json)
          Key functions:
          - convertToTimezone(datetime, fromTz, toTz): Convert times between zones
          - isValidTimezone(tz): Validate against moment.tz.names()
          - getTimezoneOffset(tz, date): Get offset for specific date (handles DST)

          Example: Provider in 'America/Los_Angeles', Client in 'America/New_York'
          - Provider slot: 9:00 AM PST → Convert to 12:00 PM EST for client
          - Store appointments in UTC (TIMESTAMPTZ), convert on read

          CRITICAL DST edge cases to test:
          - Spring forward (2:00 AM → 3:00 AM): 2:30 AM doesn't exist
          - Fall back (2:00 AM → 1:00 AM): 1:30 AM occurs twice
          - Test dates: March 10, 2024 (spring), November 3, 2024 (fall)
          Roadmap risk mitigation: "Use well-tested library + comprehensive DST tests" -->

  4. Service orchestrating search, caching hot queries in Redis with eviction strategy.
     <!-- Step 4 Implementation (backend/src/services/availability.service.js):
          Main function: findAvailableSlots(searchParams)
          Orchestration flow:
          1. Validate inputs (duration, date range, timezone)
          2. Check Redis cache: cache:availability:${tenantId}:${hash(searchParams)}
          3. If cache miss:
             a. getCalendarsWithSkills() → matching calendars
             b. For each calendar:
                - Get recurring availability slots
                - Generate concrete time windows for date range
                - Filter via isFree() for each window
                - Convert timezone to client timezone
             c. Aggregate results, rank by earliest available
             d. Cache in Redis (TTL: 15 min from .env CACHE_TTL_AVAILABILITY)
          4. Return results with metadata (search duration, cache hit/miss)

          Cache key structure:
          cache:availability:{tenantId}:{skillIds}:{startDate}:{endDate}:{duration}

          Cache invalidation triggers (Phase 3):
          - New appointment created → invalidate related calendar cache
          - Appointment cancelled → invalidate related calendar cache
          - Calendar availability updated → invalidate calendar cache

          Phase 1: Implement search WITHOUT cache (cache in Phase 3 Week 10)
          But design functions to be PURE (no side effects) for easy caching later
          Roadmap: "Cache-Ready Design" → deterministic functions -->

- **Testing**:
  - Unit: `isFree`, timezone utilities, skill matching combinations.
  - Integration: API endpoint that exercises search pipeline.
  - Performance smoke tests (k6/Jest timers) to ensure baseline response time under load.
- **Observability**: Add structured logging (duration, match counts) and metric hooks (future Prometheus integration).

### 4. Frontend Integration (Parallel Weeks 3-5)
- Auth flows: register/login/logout, token storage, automatic refresh, protected routes.
- Admin dashboards: skill and calendar management interfaces.
- Availability search UI: filters, slot listings, booking CTA tied to appointment endpoint.
- Component testing with Vitest/RTL; Cypress/Playwright E2E covering key flows.

### 5. CI/CD & DevEx Enhancements
- Expand GitHub Actions to run backend & frontend test suites, linting, and build steps.
- Configure test database provisioning in CI (Docker service containers).
- Add coverage thresholds enforcement for new modules.
- Document `.env` additions and update `.env.example`; check secrets management.

## Execution Sequence

1. **Sprint 1 (Week 2)**: Auth schema & services, JWT utilities, login/register endpoints, backend tests, minimal frontend login form. Merge once all acceptance tests pass.
2. **Sprint 2 (Week 3)**: Skill & calendar models/endpoints + integration tests; extend frontend admin screens; begin availability algorithm design spike.
3. **Sprint 3 (Week 4)**: Implement availability search core, conflict detection, slot APIs; add Redis caching; backend integration tests + targeted performance checks.
4. **Sprint 4 (Week 5)**: Complete appointment flows, finalize frontend booking experience, harden algorithm edge cases, finalize E2E suites, polish docs.

## Testing Strategy

- **Factories**: Finalize `tests/factories/*.js` for users, skills, calendars, slots, appointments.
- **Unit**: Jest for backend, Vitest for frontend; focus on services/utilities.
- **Integration**: Supertest hitting express app against test DB (using transactional teardown).
- **E2E**: Playwright scenario coverage (auth, CRUD, booking).
- **Load/Smoke**: Baseline k6 script for availability search (executed from CI nightly or manual gate).
- **Coverage Targets**: Maintain ≥ 80% for new modules with rationale if lower.
- **Test Data Lifecycle**: Implement Jest global setup/teardown (backend/tests/setup.js) to migrate schemas and clean data using transactions.

## Acceptance Criteria Mapping

- ✅ Auth endpoints + JWT/refresh + secure logout → mapped to Phase 1 Identity tasks.
- ✅ Skill/Calendar/Appointment CRUD with validations → maps to core data deliverables.
- ✅ Availability search with ≥80% coverage → algorithm objectives.
- ✅ Frontend UI flows (registration, skill creation, booking) → ensures E2E deliverables.
- ✅ CI executes full test suite, coverage, lint → quality gate requirement.
- ✅ No critical security vulnerabilities → include npm audit + dependency review in PR checklist.

## Documentation & Communication

- Update README with new scripts/endpoints post-implementation.
- Add API reference snippets to `docs/api/` (OpenAPI stub or markdown tables).
- Maintain changelog for Phase 1 to ease stakeholder reviews.
- Pair backlog tickets with roadmap IDs (e.g., `PH1-AUTH-REG`) for traceability.

## Risks & Mitigations

<!-- COMMENT: These are real risks from similar projects. Priority order matters. -->

- **Timezone Edge Cases**: Use well-tested library + comprehensive DST tests.
  <!-- MITIGATION PLAN:
       ✓ Use moment-timezone (battle-tested, 500k+ weekly downloads)
       ✓ Test DST transitions: March 10, 2024 (spring forward), Nov 3, 2024 (fall back)
       ✓ Test edge cases: midnight crossings, leap years, timezone changes mid-booking
       ✓ Store all times in UTC (TIMESTAMPTZ), convert only at API boundary
       ✓ Validate timezone names against IANA list on calendar creation
       Risk level: HIGH → Implementation: Week 4
       Roadmap reference: Phase 1 risk mitigation section -->

- **Query Performance**: Profile availability search early with realistic test data, add DB indexes (email, tenant_id, calendar_id, time range).
  <!-- MITIGATION PLAN:
       ✓ Add indexes in migration scripts (not as afterthought)
       Critical indexes:
       - CREATE INDEX idx_appointments_calendar_time ON appointments(calendar_id, start_time, end_time);
       - CREATE INDEX idx_calendar_skills_lookup ON calendar_skills(skill_id, calendar_id);
       - CREATE INDEX idx_calendars_active ON calendars(is_active) WHERE is_active = true;
       ✓ Generate realistic test data: 100 calendars, 1000 appointments, 50 skills
       ✓ Run EXPLAIN ANALYZE on search queries, aim for index scans (not seq scans)
       ✓ Baseline performance: < 200ms for single-skill search with 7-day window
       ✓ Load test with k6: 100 concurrent searches should complete in < 1s
       Risk level: MEDIUM → Implementation: Week 4
       Roadmap reference: Section 9.1 database indexes, Phase 3 performance testing -->

- **Token Security**: Store refresh tokens securely (httpOnly cookie) and rotate on use.
  <!-- MITIGATION PLAN:
       ✓ Refresh tokens: httpOnly, secure, sameSite='strict' cookies
       ✓ Token rotation: Issue new refresh token on every refresh (invalidate old one)
       ✓ Store revoked tokens in Redis (key: token hash, TTL: token expiry)
       ✓ No refresh tokens in localStorage (XSS vulnerability)
       ✓ Access tokens short-lived (1h), refresh tokens longer (7d)
       ✓ Implement token blacklist check in requireAuth middleware
       Risk level: CRITICAL → Implementation: Week 2
       Roadmap reference: Phase 1 Week 2 JWT implementation -->

- **Test Isolation**: Ensure test DB resets via transactions to prevent flaky results.
  <!-- MITIGATION PLAN:
       ✓ Use separate test database (DATABASE_TEST_URL in .env)
       ✓ Wrap each test in transaction, rollback after (Jest beforeEach/afterEach)
       ✓ Alternative: Use database-level schema per test suite
       ✓ CI/CD: Docker test services (postgres-test, redis-test) independent of dev
       ✓ Integration tests: Use supertest with transactional rollback
       ✓ Avoid shared state: Each test creates its own fixtures
       Implementation pattern:
       beforeEach(async () => { await db.query('BEGIN') })
       afterEach(async () => { await db.query('ROLLBACK') })
       Risk level: MEDIUM → Implementation: Week 2
       Reference: backend/tests/setup.js:25 -->

- **Frontend/Backend Contract Drift**: Generate shared API types (OpenAPI → TS types) or use Zod schemas to validate responses.
  <!-- MITIGATION PLAN:
       Option 1 (Recommended): OpenAPI-first approach
       - Define API spec in docs/api/openapi.yaml
       - Generate TypeScript types: openapi-typescript package
       - Frontend uses generated types for API calls
       - Backend validates against spec with express-openapi-validator

       Option 2: Zod schemas
       - Define schemas in shared/ directory
       - Backend validates requests with Zod
       - Frontend validates responses with Zod
       - Runtime type safety on both ends

       Phase 1 approach: Manual type definitions + integration tests
       Phase 2: Implement OpenAPI spec generation
       Risk level: LOW (caught by integration tests) → Implementation: Phase 2
       Roadmap reference: Phase 2 Week 8 schema contract tests -->

## Definition of Done (Per Story)

- Code merged to `main` with peer review.
- All relevant tests green locally and in CI.
- Acceptance criteria satisfied and demonstrated (screenshots or recorded run).
- Documentation updated (README, docs/, inline comments where necessary).
- Observability/logging in place for production diagnostics.

## Next Steps

1. Groom backlog tickets aligned to the milestones above.
   <!-- Create tickets in project board (GitHub Projects or Jira):
        Sprint 1 (Week 2):
        - PH1-AUTH-001: Create users table migration with indexes
        - PH1-AUTH-002: Implement bcrypt password hashing utilities
        - PH1-AUTH-003: Implement JWT generation and validation
        - PH1-AUTH-004: Create auth service (register, login, logout, refresh)
        - PH1-AUTH-005: Create auth routes and middleware
        - PH1-AUTH-006: Add rate limiting to auth endpoints
        - PH1-AUTH-007: Unit tests for auth utilities (100% coverage)
        - PH1-AUTH-008: Integration tests for auth endpoints
        - PH1-AUTH-009: Frontend login/register components

        Sprint 2 (Week 3):
        - PH1-MODEL-001: Create skills table migration
        - PH1-MODEL-002: Create calendars table migration
        - PH1-MODEL-003: Create availability_slots table migration
        - PH1-MODEL-004: Create appointments table migration
        - PH1-MODEL-005: Create calendar_skills junction table
        - PH1-MODEL-006: Implement CRUD services for skills
        - PH1-MODEL-007: Implement CRUD services for calendars
        - PH1-MODEL-008: Frontend admin UI for skills/calendars

        Sprint 3 (Week 4):
        - PH1-SEARCH-001: Implement getCalendarsWithSkills query
        - PH1-SEARCH-002: Implement isFree conflict detection
        - PH1-SEARCH-003: Implement timezone utilities (with DST tests)
        - PH1-SEARCH-004: Implement findAvailableSlots orchestrator
        - PH1-SEARCH-005: Create search API endpoint
        - PH1-SEARCH-006: Unit tests (80%+ coverage target)
        - PH1-SEARCH-007: Performance baseline tests

        Sprint 4 (Week 5):
        - PH1-E2E-001: Playwright E2E test suite
        - PH1-E2E-002: Frontend booking UI
        - PH1-DOC-001: API documentation
        - PH1-DOC-002: Update README with Phase 1 features -->

2. Finalize test database setup script in `backend/tests/setup.js`.
   <!-- CRITICAL: This must be done BEFORE starting Sprint 1.
        Setup script should:
        1. Create test database connection using DATABASE_TEST_URL
        2. Run all migrations to create schema
        3. Provide helpers for test data cleanup (transaction rollback)
        4. Export db connection for use in tests

        Reference implementation:
        - backend/tests/setup.js (already stubbed)
        - backend/src/config/database.js:11 (connection pool)

        Also create: backend/tests/factories/ directory
        - users.factory.js: Generate fake users with @faker-js/faker
        - skills.factory.js: Generate fake skills
        - calendars.factory.js: Generate fake calendars
        - appointments.factory.js: Generate fake appointments

        Roadmap ref: Phase 0 Week 1 "Setup Test Data Factories" -->

3. Spin up tracking dashboard (project board) mapping roadmap tasks to sprints.
   <!-- GitHub Projects (recommended) or Jira setup:
        Columns: Backlog | Sprint Backlog | In Progress | In Review | Done

        Labels:
        - phase-1, phase-2, etc.
        - sprint-1, sprint-2, etc.
        - auth, models, search, frontend, testing, docs
        - priority-high, priority-medium, priority-low
        - blocked, needs-review

        Views:
        1. Current Sprint: Filter by current sprint label
        2. By Workstream: Group by label (auth, models, search, etc.)
        3. By Assignee: Who's working on what
        4. Roadmap: Timeline view showing phase progression

        Integration:
        - Link PRs to tickets automatically
        - CI/CD status on tickets
        - Burndown chart per sprint

        Weekly standup format:
        - What was completed? (move tickets to Done)
        - What's in progress? (any blockers?)
        - What's next? (pull from backlog)
        - Risks? (update risks section if new risks identified) -->

---

## Additional Strategic Notes

<!-- PHASE 1 SUCCESS CRITERIA (copy to project board):
     ✅ All 5 workstreams completed with DoD met
     ✅ CI/CD pipeline green (all tests passing)
     ✅ Code review completed by 2+ reviewers
     ✅ No critical security vulnerabilities (npm audit)
     ✅ Coverage ≥ 80% for auth and search modules
     ✅ Performance baseline documented (< 200ms for simple search)
     ✅ README and API docs updated
     ✅ Demo-able: Can register, login, create calendar, search availability, book appointment

     HANDOFF TO PHASE 2:
     - All regression tests passing (foundation for REG-001)
     - Database schema stable (migrations versioned)
     - API contracts documented (OpenAPI stub ready)
     - Performance baseline recorded (compare against Phase 3 improvements)
     - Technical debt documented (if any shortcuts taken)

     LESSONS LEARNED TEMPLATE (fill after Phase 1):
     - What went well?
     - What could be improved?
     - What surprised us (good or bad)?
     - What should we do differently in Phase 2?
     - Any scope changes needed for Phase 2? -->

---

<!-- META: This strategy document should be:
     - Updated weekly with progress notes
     - Referenced in all PRs (link to relevant section)
     - Used as basis for retrospectives
     - Copied to docs/phase-2-strategy.md as template for next phase -->
