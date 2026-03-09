import { test, expect } from '@playwright/test';
import {
  expectSuccess,
  expectError,
  getTransactionId,
  submitForm,
  fillField,
  expectPrefilled,
} from './helpers';

test.describe('Card Payments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout/card');
  });

  test.describe('Page Structure', () => {
    test('displays all operation forms', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Credit Card Payment');

      // Five forms present
      await expect(page.locator('#authorizeForm')).toBeVisible();
      await expect(page.locator('#captureForm')).toBeVisible();
      await expect(page.locator('#refundForm')).toBeVisible();
      await expect(page.locator('#saleForm')).toBeVisible();
      await expect(page.locator('#voidForm')).toBeVisible();
    });

    test('authorize form is pre-filled with test data', async ({ page }) => {
      await expectPrefilled(page, 'authorizeForm', 'cardNumber', '4111111111111111');
      await expectPrefilled(page, 'authorizeForm', 'expirationMonth', '12');
      await expectPrefilled(page, 'authorizeForm', 'expirationYear', '2031');
      await expectPrefilled(page, 'authorizeForm', 'securityCode', '123');
      await expectPrefilled(page, 'authorizeForm', 'amount', '102.21');
      await expectPrefilled(page, 'authorizeForm', 'currency', 'USD');
    });

    test('sale form is pre-filled with test data', async ({ page }) => {
      await expectPrefilled(page, 'saleForm', 'cardNumber', '4111111111111111');
      await expectPrefilled(page, 'saleForm', 'expirationMonth', '12');
      await expectPrefilled(page, 'saleForm', 'expirationYear', '2031');
      await expectPrefilled(page, 'saleForm', 'securityCode', '123');
      await expectPrefilled(page, 'saleForm', 'amount', '102.21');
      await expectPrefilled(page, 'saleForm', 'currency', 'USD');
    });

    test('capture/refund/void transaction ID fields are initially empty', async ({ page }) => {
      await expect(page.locator('#captureTransactionId')).toHaveValue('');
      await expect(page.locator('#refundTransactionId')).toHaveValue('');
      await expect(page.locator('#voidTransactionId')).toHaveValue('');
    });

    test('has back to home link', async ({ page }) => {
      const backLink = page.locator('a.btn[href="/"]');
      await expect(backLink).toBeVisible();
      await expect(backLink).toContainText('Back to Home');
    });

    test('step badges are displayed', async ({ page }) => {
      await expect(page.locator('.badge.bg-primary.step-badge')).toContainText('Step 1');
      await expect(page.locator('.badge.bg-info.step-badge')).toContainText('Step 2');
      await expect(page.locator('.badge.bg-warning.step-badge')).toContainText('Step 3');
      await expect(page.locator('.badge.bg-success.step-badge')).toContainText('Standalone');
      await expect(page.locator('.badge.bg-danger.step-badge')).toContainText('Cancel');
    });
  });

  test.describe('Authorize', () => {
    test('submits with default test data and shows success', async ({ page }) => {
      await submitForm(page, 'authorizeForm');
      const alert = await expectSuccess(page, 'authorizeResult');
      await expect(alert).toContainText('AUTHORIZED');
      await expect(alert).toContainText('Authorization successful');
    });

    test('shows loading spinner during submission', async ({ page }) => {
      const btn = page.locator('#authorizeForm button[type="submit"]');
      await btn.click();
      await expect(btn).toBeDisabled();
      await expect(btn).toContainText('Processing...');
      await expect(btn).toBeEnabled({ timeout: 60_000 });
    });

    test('auto-fills capture and void transaction ID fields', async ({ page }) => {
      await submitForm(page, 'authorizeForm');
      await expectSuccess(page, 'authorizeResult');

      const txnId = await getTransactionId(page, 'authorizeResult');
      expect(txnId).toBeTruthy();
      expect(txnId.length).toBeGreaterThan(5);

      await expect(page.locator('#captureTransactionId')).toHaveValue(txnId);
      await expect(page.locator('#voidTransactionId')).toHaveValue(txnId);
    });

    test('auto-fills capture amount from authorize amount', async ({ page }) => {
      await fillField(page, 'authorizeForm', 'amount', '55.50');
      await submitForm(page, 'authorizeForm');
      await expectSuccess(page, 'authorizeResult');

      await expect(page.locator('#captureAmount')).toHaveValue('55.50');
    });

    test('copy button copies transaction ID', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await submitForm(page, 'authorizeForm');
      await expectSuccess(page, 'authorizeResult');

      const copyBtn = page.locator('#authorizeResult .copy-btn');
      await copyBtn.click();
      await expect(copyBtn).toContainText('Copied!');
    });
  });

  test.describe('Sale', () => {
    test('submits with default test data and shows success', async ({ page }) => {
      await submitForm(page, 'saleForm');
      const alert = await expectSuccess(page, 'saleResult');
      await expect(alert).toContainText('AUTHORIZED');
      await expect(alert).toContainText('Sale successful');
    });

    test('returns a transaction ID', async ({ page }) => {
      await submitForm(page, 'saleForm');
      await expectSuccess(page, 'saleResult');
      const txnId = await getTransactionId(page, 'saleResult');
      expect(txnId).toBeTruthy();
    });
  });

  test.describe('Full Lifecycle: Authorize → Capture → Refund', () => {
    test('completes the full payment lifecycle', async ({ page }) => {
      // Step 1: Authorize
      await submitForm(page, 'authorizeForm');
      const authAlert = await expectSuccess(page, 'authorizeResult');
      await expect(authAlert).toContainText('AUTHORIZED');
      const authTxnId = await getTransactionId(page, 'authorizeResult');

      // Verify auto-fill
      await expect(page.locator('#captureTransactionId')).toHaveValue(authTxnId);

      // Step 2: Capture
      await submitForm(page, 'captureForm');
      const capAlert = await expectSuccess(page, 'captureResult');
      await expect(capAlert).toContainText('PENDING');
      await expect(capAlert).toContainText('Capture successful');
      const capTxnId = await getTransactionId(page, 'captureResult');

      // Verify auto-fill
      await expect(page.locator('#refundTransactionId')).toHaveValue(capTxnId);

      // Step 3: Refund
      await submitForm(page, 'refundForm');
      const refundAlert = await expectSuccess(page, 'refundResult');
      await expect(refundAlert).toContainText('PENDING');
      await expect(refundAlert).toContainText('Refund successful');
    });
  });

  test.describe('Void', () => {
    test('voids an authorization', async ({ page }) => {
      // Authorize first
      await submitForm(page, 'authorizeForm');
      await expectSuccess(page, 'authorizeResult');
      await expect(page.locator('#voidTransactionId')).not.toHaveValue('');

      // Void it
      await submitForm(page, 'voidForm');
      const alert = await expectSuccess(page, 'voidResult');
      await expect(alert).toContainText('REVERSED');
      await expect(alert).toContainText('Void successful');
    });
  });

  test.describe('Error Handling', () => {
    test('capture with invalid transaction ID shows error', async ({ page }) => {
      await fillField(page, 'captureForm', 'transactionId', 'invalid-id-12345');
      await submitForm(page, 'captureForm');
      await expectError(page, 'captureResult');
    });

    test('refund with invalid transaction ID shows error', async ({ page }) => {
      await fillField(page, 'refundForm', 'transactionId', 'invalid-id-12345');
      await submitForm(page, 'refundForm');
      await expectError(page, 'refundResult');
    });

    test('void with invalid transaction ID shows error', async ({ page }) => {
      await fillField(page, 'voidForm', 'transactionId', 'invalid-id-12345');
      await submitForm(page, 'voidForm');
      await expectError(page, 'voidResult');
    });
  });

  test.describe('Custom Amounts', () => {
    test('authorize with $0.01 minimum amount', async ({ page }) => {
      await fillField(page, 'authorizeForm', 'amount', '0.01');
      await submitForm(page, 'authorizeForm');
      await expectSuccess(page, 'authorizeResult');
    });

    test('sale with large amount', async ({ page }) => {
      await fillField(page, 'saleForm', 'amount', '9999.99');
      await submitForm(page, 'saleForm');
      await expectSuccess(page, 'saleResult');
    });
  });
});
