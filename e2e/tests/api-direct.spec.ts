import { test, expect } from '@playwright/test';

/**
 * Direct REST API tests via Playwright request context.
 * These bypass the UI entirely and test the JSON endpoints directly.
 * Faster than UI tests — use for coverage of edge cases and response shapes.
 */
test.describe('REST API — Direct', () => {

  test.describe('Card Payments API', () => {
    test('POST /api/payments/card/authorize returns 200 with AUTHORIZED', async ({ request }) => {
      const res = await request.post('/api/payments/card/authorize', {
        data: {
          cardNumber: '4111111111111111',
          expirationMonth: '12',
          expirationYear: '2031',
          securityCode: '123',
          amount: 102.21,
          currency: 'USD',
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.status).toBe('AUTHORIZED');
      expect(body.transactionId).toBeTruthy();
      expect(body.message).toContain('Authorization successful');
      expect(body.httpStatus).toBe(201);
    });

    test('POST /api/payments/card/sale returns 200 with sale details', async ({ request }) => {
      const res = await request.post('/api/payments/card/sale', {
        data: {
          cardNumber: '4111111111111111',
          expirationMonth: '12',
          expirationYear: '2031',
          securityCode: '123',
          amount: 50.00,
          currency: 'USD',
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.status).toBe('AUTHORIZED');
      expect(body.message).toContain('Sale successful');
    });

    test('authorize → capture → refund lifecycle via API', async ({ request }) => {
      // Authorize
      const authRes = await request.post('/api/payments/card/authorize', {
        data: {
          cardNumber: '4111111111111111',
          expirationMonth: '12',
          expirationYear: '2031',
          securityCode: '123',
          amount: 25.00,
          currency: 'USD',
        },
      });
      const auth = await authRes.json();
      expect(auth.status).toBe('AUTHORIZED');

      // Capture
      const capRes = await request.post(`/api/payments/card/${auth.transactionId}/capture`, {
        data: { amount: 25.00, currency: 'USD' },
      });
      const cap = await capRes.json();
      expect(cap.status).toBe('PENDING');
      expect(cap.message).toContain('Capture successful');

      // Refund
      const refRes = await request.post(`/api/payments/card/${cap.transactionId}/refund`, {
        data: { amount: 25.00, currency: 'USD' },
      });
      const ref = await refRes.json();
      expect(ref.status).toBe('PENDING');
      expect(ref.message).toContain('Refund successful');
    });

    test('authorize → void lifecycle via API', async ({ request }) => {
      const authRes = await request.post('/api/payments/card/authorize', {
        data: {
          cardNumber: '4111111111111111',
          expirationMonth: '12',
          expirationYear: '2031',
          amount: 25.00,
          currency: 'USD',
        },
      });
      const auth = await authRes.json();

      const voidRes = await request.post(`/api/payments/card/${auth.transactionId}/void`, {
        data: {},
      });
      const voidBody = await voidRes.json();
      expect(voidBody.status).toBe('REVERSED');
    });

    test('capture with invalid ID returns error', async ({ request }) => {
      const res = await request.post('/api/payments/card/invalid-id/capture', {
        data: { amount: 10.00, currency: 'USD' },
      });
      expect(res.ok()).toBeFalsy();
    });
  });

  test.describe('Wallet Payments API', () => {
    const walletTypes = ['GOOGLE_PAY', 'APPLE_PAY', 'SAMSUNG_PAY'] as const;
    const walletNames = { GOOGLE_PAY: 'Google Pay', APPLE_PAY: 'Apple Pay', SAMSUNG_PAY: 'Samsung Pay' };

    for (const walletType of walletTypes) {
      test(`POST /api/payments/wallet/${walletType} succeeds`, async ({ request }) => {
        const res = await request.post(`/api/payments/wallet/${walletType}`, {
          data: {
            tokenData: '4111111111111111',
            expirationMonth: '12',
            expirationYear: '2026',
            cryptogram: 'EHuWW9PiBkWvqE5juRwDzAUFBAk=',
            amount: 25.00,
            currency: 'USD',
          },
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.message).toContain(walletNames[walletType]);
        expect(body.details.walletType).toBe(walletType);
      });
    }
  });

  test.describe('EFT API', () => {
    test('POST /api/payments/eft succeeds with checking account', async ({ request }) => {
      const res = await request.post('/api/payments/eft', {
        data: {
          routingNumber: '121042882',
          accountNumber: '4100',
          accountType: 'C',
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          amount: 25.00,
          currency: 'USD',
        },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.message).toContain('EFT/eCheck payment successful');
    });
  });

  test.describe('Token API', () => {
    test('store card then pay with token', async ({ request }) => {
      // Store
      const storeRes = await request.post('/api/tokens/customers', {
        data: {
          cardNumber: '4111111111111111',
          expirationMonth: '12',
          expirationYear: '2031',
          email: 'test@example.com',
        },
      });
      expect(storeRes.ok()).toBeTruthy();
      const store = await storeRes.json();
      expect(store.status).toBe('CREATED');
      expect(store.details.customerId).toBeTruthy();
      expect(store.details.paymentInstrumentId).toBeTruthy();

      // Pay
      const payRes = await request.post('/api/tokens/pay', {
        data: {
          customerId: store.details.customerId,
          amount: 25.00,
          currency: 'USD',
        },
      });
      expect(payRes.ok()).toBeTruthy();
      const pay = await payRes.json();
      expect(pay.message).toContain('Tokenized payment successful');
    });

    test('pay with invalid customer ID returns error', async ({ request }) => {
      const res = await request.post('/api/tokens/pay', {
        data: { customerId: 'invalid-id', amount: 25.00, currency: 'USD' },
      });
      expect(res.ok()).toBeFalsy();
    });
  });

  test.describe('Invoice API', () => {
    test('create → send → get invoice lifecycle', async ({ request }) => {
      // Create
      const createRes = await request.post('/api/invoices', {
        data: {
          customerEmail: 'test@example.com',
          description: 'API test invoice',
          amount: 100.00,
          currency: 'USD',
          dueDate: '2026-12-31',
        },
      });
      expect(createRes.ok()).toBeTruthy();
      const created = await createRes.json();
      expect(created.message).toContain('Invoice created');
      const invoiceId = created.transactionId;

      // Send
      const sendRes = await request.post(`/api/invoices/${invoiceId}/send`, { data: {} });
      expect(sendRes.ok()).toBeTruthy();
      const sent = await sendRes.json();
      expect(sent.message).toContain('Invoice sent');

      // Get
      const getRes = await request.get(`/api/invoices/${invoiceId}`);
      expect(getRes.ok()).toBeTruthy();
      const got = await getRes.json();
      expect(got.message).toContain('Invoice retrieved');
    });
  });

  test.describe('Payment Links API', () => {
    // Payment Links (/ipl/v2/payment-links) requires separate merchant enablement.
    // The testrest sandbox returns 401 — verify error handling.
    test('POST /api/payment-links returns error for sandbox merchant', async ({ request }) => {
      const res = await request.post('/api/payment-links', {
        data: {
          description: 'API test link',
          amount: 50.00,
          currency: 'USD',
        },
      });
      const body = await res.json();
      expect(body.status).toBe('ERROR');
      expect(body.message).toBeTruthy();
    });
  });

  test.describe('Response Shape', () => {
    test('all successful responses have consistent shape', async ({ request }) => {
      const res = await request.post('/api/payments/card/authorize', {
        data: {
          cardNumber: '4111111111111111',
          expirationMonth: '12',
          expirationYear: '2031',
          amount: 10.00,
          currency: 'USD',
        },
      });
      const body = await res.json();

      // Verify PaymentResponse shape
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('transactionId');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('httpStatus');
      expect(typeof body.status).toBe('string');
      expect(typeof body.transactionId).toBe('string');
      expect(typeof body.message).toBe('string');
      expect(typeof body.httpStatus).toBe('number');
    });

    test('error responses have consistent shape', async ({ request }) => {
      const res = await request.post('/api/payments/card/invalid/capture', {
        data: { amount: 10.00, currency: 'USD' },
      });
      const body = await res.json();

      expect(body).toHaveProperty('status');
      expect(body.status).toBe('ERROR');
      expect(body).toHaveProperty('message');
    });
  });
});
