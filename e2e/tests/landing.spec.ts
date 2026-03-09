import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays all payment method cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h2')).toContainText('Choose a Payment Method');

    // All 7 cards (6 active + 1 disabled PayPal)
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(7);

    // Active payment methods with links
    const links = page.locator('a .card');
    await expect(links).toHaveCount(6);

    // Verify each payment method is listed
    const body = page.locator('body');
    await expect(body).toContainText('Credit Card');
    await expect(body).toContainText('Digital Wallets');
    await expect(body).toContainText('EFT / eCheck');
    await expect(body).toContainText('Tokenized Payments');
    await expect(body).toContainText('Invoices');
    await expect(body).toContainText('Payment Links');
    await expect(body).toContainText('PayPal');
  });

  test('PayPal card is disabled with Coming Soon badge', async ({ page }) => {
    await page.goto('/');

    const paypalCard = page.locator('.disabled-card');
    await expect(paypalCard).toContainText('PayPal');
    await expect(paypalCard).toContainText('Coming Soon');
  });

  test('navbar shows sandbox indicator', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('nav')).toContainText('Sandbox');
    await expect(page.locator('nav')).toContainText('testrest');
  });

  const navTargets = [
    { name: 'Credit Card', href: '/checkout/card', heading: 'Credit Card Payment' },
    { name: 'Digital Wallets', href: '/checkout/wallet', heading: 'Digital Wallet Payment' },
    { name: 'EFT / eCheck', href: '/checkout/eft', heading: 'EFT / eCheck Payment' },
    { name: 'Tokenized Payments', href: '/checkout/token', heading: 'Tokenized Payments' },
    { name: 'Invoices', href: '/checkout/invoice', heading: 'Invoice Management' },
    { name: 'Payment Links', href: '/checkout/payment-link', heading: 'Create Payment Link' },
  ];

  for (const target of navTargets) {
    test(`navigates to ${target.name} page`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`a[href="${target.href}"]`).click();
      await expect(page.locator('h2')).toContainText(target.heading);
    });
  }
});
