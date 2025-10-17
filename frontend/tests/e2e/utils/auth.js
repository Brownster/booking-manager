import { expect } from '@playwright/test';

const credentials = () => ({
  email: process.env.E2E_EMAIL,
  password: process.env.E2E_PASSWORD,
  tenantId: process.env.E2E_TENANT_ID
});

export const ensureCredentialsOrSkip = (test) => {
  const { email, password, tenantId } = credentials();
  if (!email || !password || !tenantId) {
    test.skip('E2E_EMAIL, E2E_PASSWORD, and E2E_TENANT_ID must be set to run this test.');
  }
};

export const loginWithCredentials = async (page) => {
  const { email, password, tenantId } = credentials();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Tenant ID').fill(tenantId);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/$/);
};

export const logoutThroughUI = async (page) => {
  const signOutButton = page.getByRole('button', { name: /sign out/i });
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
  }
};
