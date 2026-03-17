import { test, expect } from '@playwright/test';

test.describe('Product Catalog', () => {
  test('displays welcome heading and sandbox badge', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Welcome to CyberShop');
    await expect(page.locator('body')).toContainText('Sandbox Mode');
  });

  test('renders all 6 products', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.product-card');
    await expect(cards).toHaveCount(6);
  });

  test('can add a product to the cart', async ({ page }) => {
    await page.goto('/');

    const firstAddBtn = page.locator('.product-card button').first();
    await firstAddBtn.click();

    const badge = page.locator('#cartBadge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('1');
  });

  test('navbar shows CyberShop brand and cart link', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('nav .navbar-brand')).toContainText('CyberShop');
    await expect(page.locator('nav a[href="/cart"]')).toBeVisible();
  });
});

test.describe('Cart Page', () => {
  test('shows empty cart when no items', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.locator('#emptyCart')).toBeVisible();
  });

  test('shows cart items after adding a product', async ({ page }) => {
    await page.goto('/');

    const firstAddBtn = page.locator('.product-card button').first();
    await firstAddBtn.click();

    await page.goto('/cart');

    await expect(page.locator('#filledCart')).toBeVisible();
    await expect(page.locator('#emptyCart')).not.toBeVisible();
  });

  test('displays all payment method buttons', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-card button').first().click();
    await page.goto('/cart');

    const payButtons = page.locator('.pay-method-btn');
    await expect(payButtons).toHaveCount(6);

    await expect(page.locator('body')).toContainText('Card Payment');
    await expect(page.locator('body')).toContainText('Digital Wallet');
    await expect(page.locator('body')).toContainText('Bank Transfer');
    await expect(page.locator('body')).toContainText('Saved Card');
    await expect(page.locator('body')).toContainText('Pay by Invoice');
    await expect(page.locator('body')).toContainText('Payment Link');
  });
});

test.describe('Checkout Wizard', () => {
  const methods = ['card', 'wallet', 'eft', 'token', 'invoice', 'paymentLink'];

  for (const method of methods) {
    test(`loads checkout page for ${method}`, async ({ page }) => {
      await page.goto('/');
      await page.locator('.product-card button').first().click();
      await page.goto(`/checkout?method=${method}`);

      await expect(page.locator('.wiz-label')).toContainText('CONTACT DETAILS');
    });
  }
});
