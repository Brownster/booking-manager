# Playwright End-to-End Tests

These tests exercise high-level user flows in the Calendar Booking frontend using [Playwright](https://playwright.dev/).

## Running Locally

```bash
cd frontend
npm install           # ensures @playwright/test and browsers are available
npx playwright install
npm run dev           # serve the application on http://localhost:5173
E2E_BASE_URL=http://localhost:5173 npm run test:e2e
```

The `E2E_BASE_URL` variable lets you point the tests at any deployed environment.

## Credentials

Tests that exercise authenticated flows expect these environment variables:

```
E2E_EMAIL=<user email>
E2E_PASSWORD=<user password>
E2E_TENANT_ID=<tenant uuid>
```

If they are not provided, the authenticated suites are automatically skipped.

## Current Coverage

- `authentication.spec.js` &mdash; Smoke tests for the login experience.
- `waitlist.spec.js` &mdash; Authenticated waitlist navigation & controls.
- `group-bookings.spec.js` &mdash; Authenticated wizard launch.

## Adding New Tests

1. Create a new file in `frontend/tests/e2e/`.
2. Use the shared Playwright config (`frontend/playwright.config.js`) for common settings.
3. Prefer role- and label-based selectors to keep tests resilient.
4. Capture traces/video only on failure to reduce noise.
