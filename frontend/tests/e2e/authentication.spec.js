import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Calendar Booking' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Tenant ID')).toBeVisible();
  });

  test('allows entering credentials on login form', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByLabel('Tenant ID').fill('tenant-123');

    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });
});
