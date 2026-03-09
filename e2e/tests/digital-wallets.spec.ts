import { test, expect } from '@playwright/test';
import {
  expectSuccess,
  getTransactionId,
  submitForm,
  fillField,
  expectPrefilled,
} from './helpers';

test.describe('Digital Wallets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout/wallet');
  });

  test.describe('Page Structure', () => {
    test('displays wallet payment form', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Digital Wallet Payment');
      await expect(page.locator('#walletForm')).toBeVisible();
    });

    test('wallet type dropdown has all three options', async ({ page }) => {
      const options = page.locator('#walletType option');
      await expect(options).toHaveCount(3);

      const texts = await options.allTextContents();
      expect(texts).toContain('Google Pay');
      expect(texts).toContain('Apple Pay');
      expect(texts).toContain('Samsung Pay');
    });

    test('form is pre-filled with test data', async ({ page }) => {
      await expectPrefilled(page, 'walletForm', 'tokenData', '4111111111111111');
      await expectPrefilled(page, 'walletForm', 'expirationMonth', '12');
      await expectPrefilled(page, 'walletForm', 'expirationYear', '2026');
      await expectPrefilled(page, 'walletForm', 'cryptogram', 'EHuWW9PiBkWvqE5juRwDzAUFBAk=');
      await expectPrefilled(page, 'walletForm', 'amount', '102.21');
      await expectPrefilled(page, 'walletForm', 'currency', 'USD');
    });

    test('has back to home link', async ({ page }) => {
      await expect(page.locator('a.btn[href="/"]')).toContainText('Back to Home');
    });
  });

  test.describe('Google Pay', () => {
    test('submits Google Pay with default data', async ({ page }) => {
      await page.locator('#walletType').selectOption('GOOGLE_PAY');
      await submitForm(page, 'walletForm');

      const alert = await expectSuccess(page, 'walletResult');
      await expect(alert).toContainText('Google Pay payment successful');

      const txnId = await getTransactionId(page, 'walletResult');
      expect(txnId).toBeTruthy();
    });

    test('result shows wallet type in details', async ({ page }) => {
      await page.locator('#walletType').selectOption('GOOGLE_PAY');
      await submitForm(page, 'walletForm');

      const alert = await expectSuccess(page, 'walletResult');
      await expect(alert).toContainText('GOOGLE_PAY');
    });
  });

  test.describe('Apple Pay', () => {
    test('submits Apple Pay with default data', async ({ page }) => {
      await page.locator('#walletType').selectOption('APPLE_PAY');
      await submitForm(page, 'walletForm');

      const alert = await expectSuccess(page, 'walletResult');
      await expect(alert).toContainText('Apple Pay payment successful');
    });
  });

  test.describe('Samsung Pay', () => {
    test('submits Samsung Pay with default data', async ({ page }) => {
      await page.locator('#walletType').selectOption('SAMSUNG_PAY');
      await submitForm(page, 'walletForm');

      const alert = await expectSuccess(page, 'walletResult');
      await expect(alert).toContainText('Samsung Pay payment successful');
    });
  });

  test.describe('Custom Values', () => {
    test('submits with custom amount', async ({ page }) => {
      await fillField(page, 'walletForm', 'amount', '75.50');
      await submitForm(page, 'walletForm');
      await expectSuccess(page, 'walletResult');
    });

    test('loading spinner appears during submission', async ({ page }) => {
      const btn = page.locator('#walletForm button[type="submit"]');
      await btn.click();
      await expect(btn).toBeDisabled();
      await expect(btn).toContainText('Processing...');
      await expect(btn).toBeEnabled({ timeout: 60_000 });
    });
  });
});
