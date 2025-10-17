import { test, expect } from '@playwright/test';
import { ensureCredentialsOrSkip, loginWithCredentials, logoutThroughUI } from './utils/auth.js';

test.describe('Group bookings wizard', () => {
  test.beforeEach(async ({ page }) => {
    ensureCredentialsOrSkip(test);
    await loginWithCredentials(page);
  });

  test.afterEach(async ({ page }) => {
    await logoutThroughUI(page);
  });

  test('launches wizard and shows session details step', async ({ page }) => {
    await page.goto('/group-bookings');

    await expect(page.getByRole('heading', { name: /group bookings/i })).toBeVisible();

    const createButton = page.getByRole('button', { name: /create group booking/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await expect(page.getByRole('heading', { name: /create group booking/i })).toBeVisible();
    await expect(page.getByLabel('Session Name')).toBeVisible();
  });
});
