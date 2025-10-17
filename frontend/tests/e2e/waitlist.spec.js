import { test, expect } from '@playwright/test';
import { ensureCredentialsOrSkip, loginWithCredentials, logoutThroughUI } from './utils/auth.js';

test.describe('Waitlist flow', () => {
  test.beforeEach(async ({ page }) => {
    ensureCredentialsOrSkip(test);
    await loginWithCredentials(page);
  });

  test.afterEach(async ({ page }) => {
    await logoutThroughUI(page);
  });

  test('displays waitlist entries for authenticated user', async ({ page }) => {
    await page.goto('/waitlist');

    await expect(page.getByRole('heading', { name: /waitlist/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add to waitlist/i })).toBeVisible();
  });
});
