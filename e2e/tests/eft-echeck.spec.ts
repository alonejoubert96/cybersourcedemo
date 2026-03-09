import { test, expect } from '@playwright/test';
import {
  expectSuccess,
  getTransactionId,
  submitForm,
  fillField,
  expectPrefilled,
} from './helpers';

test.describe('EFT / eCheck', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout/eft');
  });

  test.describe('Page Structure', () => {
    test('displays EFT payment form', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('EFT / eCheck Payment');
      await expect(page.locator('#eftForm')).toBeVisible();
    });

    test('form is pre-filled with test bank data', async ({ page }) => {
      await expectPrefilled(page, 'eftForm', 'routingNumber', '121042882');
      await expectPrefilled(page, 'eftForm', 'accountNumber', '4100');
      await expectPrefilled(page, 'eftForm', 'firstName', 'John');
      await expectPrefilled(page, 'eftForm', 'lastName', 'Doe');
      await expectPrefilled(page, 'eftForm', 'email', 'test@example.com');
      await expectPrefilled(page, 'eftForm', 'amount', '102.21');
      await expectPrefilled(page, 'eftForm', 'currency', 'USD');
    });

    test('account type dropdown defaults to Checking', async ({ page }) => {
      const select = page.locator('#eftForm select[name="accountType"]');
      await expect(select).toHaveValue('C');
    });

    test('account type dropdown has Checking and Savings', async ({ page }) => {
      const options = page.locator('#eftForm select[name="accountType"] option');
      await expect(options).toHaveCount(2);
      const values = await options.evaluateAll(opts =>
        opts.map(o => ({ value: (o as HTMLOptionElement).value, text: o.textContent?.trim() }))
      );
      expect(values).toContainEqual({ value: 'C', text: 'Checking' });
      expect(values).toContainEqual({ value: 'S', text: 'Savings' });
    });

    test('has back to home link', async ({ page }) => {
      await expect(page.locator('a.btn[href="/"]')).toContainText('Back to Home');
    });
  });

  test.describe('Payment Submission', () => {
    test('submits checking account payment with default data', async ({ page }) => {
      await submitForm(page, 'eftForm');
      const alert = await expectSuccess(page, 'eftResult');
      await expect(alert).toContainText('EFT/eCheck payment successful');

      const txnId = await getTransactionId(page, 'eftResult');
      expect(txnId).toBeTruthy();
    });

    test('submits savings account payment', async ({ page }) => {
      await page.locator('#eftForm select[name="accountType"]').selectOption('S');
      await submitForm(page, 'eftForm');
      await expectSuccess(page, 'eftResult');
    });

    test('submits with custom amount', async ({ page }) => {
      await fillField(page, 'eftForm', 'amount', '200.00');
      await submitForm(page, 'eftForm');
      await expectSuccess(page, 'eftResult');
    });

    test('loading spinner appears during submission', async ({ page }) => {
      const btn = page.locator('#eftForm button[type="submit"]');
      await btn.click();
      await expect(btn).toBeDisabled();
      await expect(btn).toContainText('Processing...');
      await expect(btn).toBeEnabled({ timeout: 60_000 });
    });
  });
});
