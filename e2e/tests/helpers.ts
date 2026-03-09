import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Wait for an inline result box to appear and return its container.
 * Asserts the result is a success (alert-success) or error (alert-danger).
 */
export async function waitForResult(page: Page, resultId: string) {
  const container = page.locator(`#${resultId}`);
  await expect(container).toBeVisible({ timeout: 60_000 });
  return container;
}

export async function expectSuccess(page: Page, resultId: string) {
  const container = await waitForResult(page, resultId);
  const alert = container.locator('.alert-success');
  await expect(alert).toBeVisible({ timeout: 60_000 });
  return alert;
}

export async function expectError(page: Page, resultId: string) {
  const container = await waitForResult(page, resultId);
  const alert = container.locator('.alert-danger');
  await expect(alert).toBeVisible({ timeout: 60_000 });
  return alert;
}

/**
 * Extract the transaction ID text from a result box.
 */
export async function getTransactionId(page: Page, resultId: string): Promise<string> {
  const container = page.locator(`#${resultId}`);
  const code = container.locator('.bg-light code');
  await expect(code).toBeVisible();
  const text = await code.textContent();
  return text?.trim() ?? '';
}

/**
 * Submit a form by clicking its submit button, with loading spinner check.
 */
export async function submitForm(page: Page, formId: string) {
  const form = page.locator(`#${formId}`);
  const btn = form.locator('button[type="submit"]');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  // Verify loading state appears
  await expect(btn).toBeDisabled();
  // Wait for button to re-enable (request complete — CyberSource sandbox can be slow)
  await expect(btn).toBeEnabled({ timeout: 60_000 });
}

/**
 * Fill a form field, clearing it first.
 */
export async function fillField(page: Page, formId: string, name: string, value: string) {
  const input = page.locator(`#${formId} [name="${name}"]`);
  await input.fill(value);
}

/**
 * Verify pre-filled test data in a form input.
 */
export async function expectPrefilled(page: Page, formId: string, name: string, expected: string) {
  const input = page.locator(`#${formId} [name="${name}"]`);
  await expect(input).toHaveValue(expected);
}
