import { test, expect } from '@playwright/test';
import {
  expectSuccess,
  expectError,
  getTransactionId,
  submitForm,
  fillField,
  expectPrefilled,
} from './helpers';

test.describe('Tokenized Payments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout/token');
  });

  test.describe('Page Structure', () => {
    test('displays both store and pay forms', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Tokenized Payments');
      await expect(page.locator('#storeForm')).toBeVisible();
      await expect(page.locator('#payForm')).toBeVisible();
    });

    test('store form is pre-filled with test data', async ({ page }) => {
      await expectPrefilled(page, 'storeForm', 'cardNumber', '4111111111111111');
      await expectPrefilled(page, 'storeForm', 'expirationMonth', '12');
      await expectPrefilled(page, 'storeForm', 'expirationYear', '2031');
      await expectPrefilled(page, 'storeForm', 'firstName', 'John');
      await expectPrefilled(page, 'storeForm', 'lastName', 'Doe');
      await expectPrefilled(page, 'storeForm', 'email', 'test@example.com');
    });

    test('pay form has empty customer ID and pre-filled amount', async ({ page }) => {
      await expect(page.locator('#payCustomerId')).toHaveValue('');
      await expectPrefilled(page, 'payForm', 'amount', '102.21');
      await expectPrefilled(page, 'payForm', 'currency', 'USD');
    });

    test('has step badges', async ({ page }) => {
      await expect(page.locator('.badge.bg-primary.step-badge')).toContainText('Step 1');
      await expect(page.locator('.badge.bg-success.step-badge')).toContainText('Step 2');
    });

    test('has flow arrow between steps', async ({ page }) => {
      await expect(page.locator('.flow-arrow')).toBeVisible();
    });

    test('has back to home link', async ({ page }) => {
      await expect(page.locator('a.btn[href="/"]')).toContainText('Back to Home');
    });
  });

  test.describe('Store Card', () => {
    test('stores card and shows customer ID', async ({ page }) => {
      await submitForm(page, 'storeForm');
      const alert = await expectSuccess(page, 'storeResult');
      await expect(alert).toContainText('CREATED');
      await expect(alert).toContainText('Customer and payment instrument stored successfully');
    });

    test('result includes customerId and paymentInstrumentId', async ({ page }) => {
      await submitForm(page, 'storeForm');
      const alert = await expectSuccess(page, 'storeResult');
      await expect(alert).toContainText('customerId');
      await expect(alert).toContainText('paymentInstrumentId');
    });

    test('auto-fills customer ID into pay form', async ({ page }) => {
      await submitForm(page, 'storeForm');
      await expectSuccess(page, 'storeResult');

      const txnId = await getTransactionId(page, 'storeResult');
      expect(txnId).toBeTruthy();
      await expect(page.locator('#payCustomerId')).toHaveValue(txnId);
    });
  });

  test.describe('Full Flow: Store → Pay', () => {
    test('stores a card then pays with the token', async ({ page }) => {
      // Step 1: Store card
      await submitForm(page, 'storeForm');
      await expectSuccess(page, 'storeResult');
      const customerId = await getTransactionId(page, 'storeResult');
      expect(customerId).toBeTruthy();

      // Verify auto-fill
      await expect(page.locator('#payCustomerId')).toHaveValue(customerId);

      // Step 2: Pay with token
      await submitForm(page, 'payForm');
      const alert = await expectSuccess(page, 'payResult');
      await expect(alert).toContainText('Tokenized payment successful');

      const payTxnId = await getTransactionId(page, 'payResult');
      expect(payTxnId).toBeTruthy();
    });

    test('can pay multiple times with same token', async ({ page }) => {
      // Store card
      await submitForm(page, 'storeForm');
      await expectSuccess(page, 'storeResult');

      // First payment
      await submitForm(page, 'payForm');
      await expectSuccess(page, 'payResult');

      // Second payment with different amount
      await fillField(page, 'payForm', 'amount', '50.00');
      await submitForm(page, 'payForm');
      await expectSuccess(page, 'payResult');
    });
  });

  test.describe('Error Handling', () => {
    test('pay with invalid customer ID shows error', async ({ page }) => {
      await fillField(page, 'payForm', 'customerId', 'invalid-customer-id');
      await submitForm(page, 'payForm');
      await expectError(page, 'payResult');
    });
  });
});
