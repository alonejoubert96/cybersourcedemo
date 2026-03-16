---
title: Card Payments
description: Authorize, sale, capture, refund, and void credit card transactions.
---

:::tip[Try it live]
**[Open Card Checkout →](http://localhost:8080/checkout?method=card)** — or use the legacy API test page at [`/demo/card`](http://localhost:8080/demo/card). Requires `./gradlew bootRun`.
:::

`CardPaymentService` handles **authorize → capture → refund**, **sale** (auth+capture in one step), and **void**.

## Operations Overview

| Operation | What It Does | Endpoint | SDK API |
|---|---|---|---|
| **Authorize** | Reserves funds on the card | `POST /api/payments/card/authorize` | `PaymentsApi.createPayment()` |
| **Sale** | Authorizes and captures in one step | `POST /api/payments/card/sale` | `PaymentsApi.createPayment()` with `capture(true)` |
| **Capture** | Settles a previous authorization | `POST /api/payments/card/{id}/capture` | `CaptureApi.capturePayment()` |
| **Refund** | Returns funds from a captured payment | `POST /api/payments/card/{id}/refund` | `RefundApi.refundCapture()` |
| **Void** | Cancels an authorization before settlement | `POST /api/payments/card/{id}/void` | `VoidApi.voidPayment()` |

## Data Flow — Authorize / Sale

```
Client (JSON)                    CardPaymentController              CardPaymentService
─────────────                    ─────────────────────              ──────────────────
POST /api/payments/card/authorize
{                           ──▶  authorize(PaymentRequest)    ──▶  processPayment(req, false)
  cardNumber,                                                        │
  expirationMonth,                                                   ├─ ApiClientFactory.create()
  expirationYear,                                                    │    └─ new ApiClient()
  securityCode,                                                      │    └─ new MerchantConfig(props)
  amount,                                                            │
  currency                                                           ├─ Build CreatePaymentRequest
}                                                                    │    ├─ clientReferenceInformation.code
                                                                     │    ├─ processingInformation.capture(false)
                                                                     │    ├─ paymentInformation.card
                                                                     │    │    ├─ number, expMonth, expYear
                                                                     │    │    └─ securityCode
                                                                     │    └─ orderInformation
                                                                     │         ├─ amountDetails (total, currency)
                                                                     │         └─ billTo (name, address)
                                                                     │
                                                                     ├─ PaymentsApi.createPayment(request)
                                                                     │    └─ SDK: POST /pts/v2/payments
                                                                     │
                                                                     └─ Map PtsV2PaymentsPost201Response
                                                                          └─ → PaymentResponse
```

### Authorize vs Sale

The only difference is the `processingInformation.capture` flag:

```java
// Authorize — hold funds, settle later
processingInfo.capture(false);

// Sale — authorize + capture in one call
processingInfo.capture(true);
```

## Data Flow — Capture

```
POST /api/payments/card/{paymentId}/capture
{ amount, currency }

    │
    ▼
CardPaymentService.capture(paymentId, amount, currency)
    │
    ├─ Build CapturePaymentRequest
    │    ├─ clientReferenceInformation.code
    │    └─ orderInformation.amountDetails (total, currency)
    │
    ├─ CaptureApi.capturePayment(request, paymentId)
    │    └─ SDK: POST /pts/v2/payments/{id}/captures
    │
    └─ Map PtsV2PaymentsCapturesPost201Response → PaymentResponse
```

## Data Flow — Refund

```
POST /api/payments/card/{captureId}/refund
{ amount, currency }

    │
    ▼
CardPaymentService.refund(captureId, amount, currency)
    │
    ├─ Build RefundCaptureRequest
    │    ├─ Ptsv2paymentsidrefundsClientReferenceInformation.code
    │    └─ orderInformation.amountDetails
    │
    ├─ RefundApi.refundCapture(request, captureId)
    │    └─ SDK: POST /pts/v2/payments/{id}/refunds
    │
    └─ Map PtsV2PaymentsRefundPost201Response → PaymentResponse
```

:::note
Refund uses a **different client reference info type** (`Ptsv2paymentsidrefundsClientReferenceInformation`) than authorize/sale. The SDK uses separate model classes for each operation's sub-resources.
:::

## Data Flow — Void

```
POST /api/payments/card/{paymentId}/void

    │
    ▼
CardPaymentService.voidPayment(paymentId)
    │
    ├─ Build VoidPaymentRequest
    │    └─ Ptsv2paymentsidreversalsClientReferenceInformation.code
    │
    ├─ VoidApi.voidPayment(request, paymentId)
    │    └─ SDK: POST /pts/v2/payments/{id}/voids
    │
    └─ Map PtsV2PaymentsVoidsPost201Response → PaymentResponse
```

## Typical Flow: Authorize → Capture → Refund

```
Step 1: Authorize                Step 2: Capture              Step 3: Refund
──────────────────               ───────────────              ──────────────
POST /card/authorize    ──▶      POST /card/{id}/capture ──▶  POST /card/{id}/refund
                                 (use authorize's txn ID)     (use capture's txn ID)
Response:                        Response:                    Response:
  status: AUTHORIZED             status: PENDING              status: PENDING
  transactionId: "abc123"        transactionId: "def456"      transactionId: "ghi789"
```

## UI Demo — Storefront Checkout

The primary card flow uses the **CyberShop checkout wizard** at [`/checkout?method=card`](http://localhost:8080/checkout?method=card):

1. **Add products** to your cart from the product catalog at [`/`](http://localhost:8080)
2. **Go to cart** (`/cart`) and click **Card Payment**
3. **Step 1: Contact Details** — Enter email and phone, click Continue
4. **Step 2: Payment Details** — Card number, expiry, CVV, billing address. All pre-filled with sandbox test data. Click Continue.
5. **Step 3: Review & Confirm** — Review all sections (each with an Edit link), click **Card Payment** to submit
6. **Order Confirmation** — Shows transaction ID, order number, and shipping details

The checkout wizard uses the **Sale** operation (authorize + capture in one step).

### Legacy API Test Page

For testing the full lifecycle (authorize → capture → refund → void), use the legacy demo page at [`/demo/card`](http://localhost:8080/demo/card). This page provides individual forms for each operation with auto-populated transaction IDs between steps.

## REST API Examples

### Authorize

```bash
curl -X POST http://localhost:8080/api/payments/card/authorize \
  -H 'Content-Type: application/json' \
  -d '{
    "cardNumber": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2031",
    "securityCode": "123",
    "amount": 25.00,
    "currency": "ZAR"
  }'
```

### Sale (Auth + Capture)

```bash
curl -X POST http://localhost:8080/api/payments/card/sale \
  -H 'Content-Type: application/json' \
  -d '{
    "cardNumber": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2031",
    "amount": 50.00,
    "currency": "ZAR"
  }'
```

### Capture (use transactionId from authorize)

```bash
curl -X POST http://localhost:8080/api/payments/card/{transactionId}/capture \
  -H 'Content-Type: application/json' \
  -d '{ "amount": 25.00, "currency": "ZAR" }'
```

### Refund (use transactionId from capture)

```bash
curl -X POST http://localhost:8080/api/payments/card/{transactionId}/refund \
  -H 'Content-Type: application/json' \
  -d '{ "amount": 25.00, "currency": "ZAR" }'
```

### Void (use transactionId from authorize)

```bash
curl -X POST http://localhost:8080/api/payments/card/{transactionId}/void
```

## Test Data

| Field | Value |
|---|---|
| Card Number | `4111111111111111` (Visa test) |
| Expiration Month | `12` |
| Expiration Year | `2031` |
| Security Code | `123` |
| Amount | Any positive number (e.g. `25.00`) |
| Currency | `ZAR` |

See [Test Data Reference](/reference/test-data/) for additional test card numbers.

## SDK Classes Used

| Class | Purpose |
|---|---|
| `CreatePaymentRequest` | Auth/sale request body |
| `CapturePaymentRequest` | Capture request body |
| `RefundCaptureRequest` | Refund request body |
| `VoidPaymentRequest` | Void request body |
| `Ptsv2paymentsPaymentInformationCard` | Card number, expiry, CVV |
| `Ptsv2paymentsOrderInformationAmountDetails` | Amount and currency |
| `Ptsv2paymentsOrderInformationBillTo` | Billing address |
| `PtsV2PaymentsPost201Response` | Auth/sale response |
| `PtsV2PaymentsCapturesPost201Response` | Capture response |
| `PtsV2PaymentsRefundPost201Response` | Refund response |
| `PtsV2PaymentsVoidsPost201Response` | Void response |
