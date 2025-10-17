# Phase 2 Status Snapshot

**Date:** 2025-10-16

## ✅ Completed

- RBAC backend (migrations `0007`–`0009`, services, middleware, `/api/v1/rbac/*` routes)
- RBAC admin UI shell (role cards, detail & assignment modals, feature flag aware nav)
- Waitlist page scaffolding with mock entries & actions
- Frontend provider hierarchy (Auth/RBAC/FeatureFlags) and core UI kit
- System roles auto-seeded for existing tenants via `seed_tenant_roles`

## 🔄 In Progress

- Hook RBAC admin UI to live endpoints (role CRUD, user assignment)
- Implement waitlist CRUD + backend services tied to availability
- Restore group booking wizard UI with provider/participant selection

## ⏭ Next Focus

1. Wire frontend RBAC calls to backend and add optimistic updates/tests
2. Build waitlist API (endpoints, service layer) and connect UI
3. Reintroduce group booking wizard backed by availability search
4. Add Vitest/Playwright coverage for permission-gated navigation and flows
