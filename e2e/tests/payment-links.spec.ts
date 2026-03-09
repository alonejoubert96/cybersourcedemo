import { test, expect } from '@playwright/test';
import {
  expectSuccess,
  getTransactionId,
  submitForm,
  fillField,
  expectPrefilled,
} from './helpers';

test.describe('Payment Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout/payment-link');
  });

  test.describe('Page Structure', () => {
    test('displays payment link form', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Create Payment Link');
      await expect(page.locator('#linkForm')).toBeVisible();
    });

    test('form is pre-filled with test data', async ({ page }) => {
      await expectPrefilled(page, 'linkForm', 'description', 'Demo payment link');
      await expectPrefilled(page, 'linkForm', 'amount', '50.00');
      await expectPrefilled(page, 'linkForm', 'currency', 'USD');
    });

    test('has back to home link', async ({ page }) => {
      await expect(page.locator('a.btn[href="/"]')).toContainText('Back to Home');
    });
  });

  test.describe('Create Payment Link', () => {
    // Payment Links API (/ipl/v2/payment-links) requires separate merchant enablement.
    // The testrest sandbox merchant does not have this feature — these tests verify error handling.

    test('submits form and shows result', async ({ page }) => {
      await submitForm(page, 'linkForm');
      // Sandbox returns 401 — verify the result box appears with a response
      const container = page.locator('#linkResult');
      await expect(container.locator('.alert')).toBeVisible({ timeout: 30_000 });
    });

    test('loading spinner appears during submission', async ({ page }) => {
      const btn = page.locator('#linkForm button[type="submit"]');
      await btn.click();
      await expect(btn).toBeDisabled();
      await expect(btn).toContainText('Processing...');
      await expect(btn).toBeEnabled({ timeout: 60_000 });
    });
  });
});
