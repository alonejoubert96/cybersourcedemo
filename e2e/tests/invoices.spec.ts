import { test, expect } from '@playwright/test';
import {
  expectSuccess,
  expectError,
  getTransactionId,
  submitForm,
  fillField,
  expectPrefilled,
} from './helpers';

test.describe('Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout/invoice');
  });

  test.describe('Page Structure', () => {
    test('displays all three invoice forms', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Invoice Management');
      await expect(page.locator('#createForm')).toBeVisible();
      await expect(page.locator('#sendForm')).toBeVisible();
      await expect(page.locator('#getForm')).toBeVisible();
    });

    test('create form is pre-filled with test data', async ({ page }) => {
      await expectPrefilled(page, 'createForm', 'customerEmail', 'test@example.com');
      await expectPrefilled(page, 'createForm', 'description', 'Demo invoice item');
      await expectPrefilled(page, 'createForm', 'amount', '100.00');
      await expectPrefilled(page, 'createForm', 'currency', 'USD');
      await expectPrefilled(page, 'createForm', 'dueDate', '2026-04-01');
    });

    test('send and get forms have empty invoice ID fields', async ({ page }) => {
      await expect(page.locator('#sendInvoiceId')).toHaveValue('');
      await expect(page.locator('#getInvoiceId')).toHaveValue('');
    });

    test('has step badges and optional badge', async ({ page }) => {
      await expect(page.locator('.badge.bg-primary.step-badge')).toContainText('Step 1');
      await expect(page.locator('.badge.bg-success.step-badge')).toContainText('Step 2');
      await expect(page.locator('.badge.bg-secondary.step-badge')).toContainText('Optional');
    });

    test('has back to home link', async ({ page }) => {
      await expect(page.locator('a.btn[href="/"]')).toContainText('Back to Home');
    });
  });

  test.describe('Create Invoice', () => {
    test('creates invoice with default data', async ({ page }) => {
      await submitForm(page, 'createForm');
      const alert = await expectSuccess(page, 'createResult');
      // Invoice creation returns a status (e.g. DRAFT or similar)
      await expect(alert).toContainText('Invoice created successfully');
    });

    test('returns an invoice ID', async ({ page }) => {
      await submitForm(page, 'createForm');
      await expectSuccess(page, 'createResult');
      const invoiceId = await getTransactionId(page, 'createResult');
      expect(invoiceId).toBeTruthy();
    });

    test('auto-fills invoice ID into send and get forms', async ({ page }) => {
      await submitForm(page, 'createForm');
      await expectSuccess(page, 'createResult');

      const invoiceId = await getTransactionId(page, 'createResult');
      expect(invoiceId).toBeTruthy();

      await expect(page.locator('#sendInvoiceId')).toHaveValue(invoiceId);
      await expect(page.locator('#getInvoiceId')).toHaveValue(invoiceId);
    });

    test('creates invoice with custom values', async ({ page }) => {
      await fillField(page, 'createForm', 'customerEmail', 'custom@test.com');
      await fillField(page, 'createForm', 'description', 'Custom test item');
      await fillField(page, 'createForm', 'amount', '250.00');
      await submitForm(page, 'createForm');
      await expectSuccess(page, 'createResult');
    });
  });

  test.describe('Full Flow: Create → Send', () => {
    test('creates and sends an invoice', async ({ page }) => {
      // Step 1: Create
      await submitForm(page, 'createForm');
      await expectSuccess(page, 'createResult');
      const invoiceId = await getTransactionId(page, 'createResult');

      // Verify auto-fill
      await expect(page.locator('#sendInvoiceId')).toHaveValue(invoiceId);

      // Step 2: Send
      await submitForm(page, 'sendForm');
      const alert = await expectSuccess(page, 'sendResult');
      await expect(alert).toContainText('Invoice sent successfully');
    });
  });

  test.describe('Get Invoice', () => {
    test('retrieves a created invoice', async ({ page }) => {
      // Create first
      await submitForm(page, 'createForm');
      await expectSuccess(page, 'createResult');

      // Verify auto-fill
      await expect(page.locator('#getInvoiceId')).not.toHaveValue('');

      // Get
      await submitForm(page, 'getForm');
      const alert = await expectSuccess(page, 'getResult');
      await expect(alert).toContainText('Invoice retrieved');
    });
  });

  test.describe('Error Handling', () => {
    test('send with invalid invoice ID shows error', async ({ page }) => {
      await fillField(page, 'sendForm', 'invoiceId', 'invalid-invoice-id');
      await submitForm(page, 'sendForm');
      await expectError(page, 'sendResult');
    });

    test('get with invalid invoice ID shows error', async ({ page }) => {
      await fillField(page, 'getForm', 'invoiceId', 'invalid-invoice-id');
      await submitForm(page, 'getForm');
      await expectError(page, 'getResult');
    });
  });
});
