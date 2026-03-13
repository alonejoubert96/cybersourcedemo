---
title: Payment Links
description: Generate shareable payment URLs for easy checkout.
---

:::tip[Try it live]
**[Open Payment Link Checkout →](http://localhost:8080/checkout?method=paymentLink)** — or use the legacy API test page at [`/demo/payment-link`](http://localhost:8080/demo/payment-link). Requires `./gradlew bootRun`.
:::

The `PaymentLinkService` creates **pay-by-link** URLs — shareable links that open a CyberSource-hosted payment page. Useful for email/SMS payment collection without building your own checkout form.

## API Endpoint

```
POST /api/payment-links
```

## Data Flow

```
POST /api/payment-links
{                                PaymentLinkController          PaymentLinkService
  description,              ──▶  create(PaymentLinkRequest) ──▶  createPaymentLink(request)
  amount,                                                        │
  currency                                                       ├─ ApiClientFactory.create()
}                                                                │
                                                                 ├─ Build CreatePaymentLinkRequest
                                                                 │    └─ orderInformation
                                                                 │         └─ amountDetails
                                                                 │              ├─ .totalAmount
                                                                 │              └─ .currency
                                                                 │
                                                                 ├─ PaymentLinksApi.createPaymentLink(request)
                                                                 │    └─ SDK: POST /ipl/v2/payment-links
                                                                 │
                                                                 └─ Map PblPaymentLinksPost201Response
                                                                      └─ → PaymentResponse
                                                                           ├─ status
                                                                           ├─ transactionId (link ID)
                                                                           └─ details.linkId
```

### SDK Model Naming

Payment link models use the `Iplv2` prefix (Invoice Payment Links v2) and response uses `Pbl` prefix (Pay By Link):

```java
// Request models
Iplv2paymentlinksOrderInformation orderInfo = new ...;
Iplv2paymentlinksOrderInformationAmountDetails amountDetails = new ...;

// Response model
PblPaymentLinksPost201Response result = api.createPaymentLink(linkRequest);
```

## UI Demo — Storefront Checkout

The payment link flow uses the **CyberShop checkout wizard** at [`/checkout?method=paymentLink`](http://localhost:8080/checkout?method=paymentLink):

1. Add products to your cart, go to cart, and click **Payment Link**
2. **Step 1: Contact Details** — Email and phone
3. **Step 2: Payment Link Details** — Description
4. **Step 3: Review & Confirm** — Click **Payment Link** to generate the link
5. **Order Confirmation** — Shows the generated link ID and status

The legacy API test page is available at [`/demo/payment-link`](http://localhost:8080/demo/payment-link).

## REST API Example

```bash
curl -X POST http://localhost:8080/api/payment-links \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "Demo payment link",
    "amount": 50.00,
    "currency": "ZAR"
  }'
```

## Test Data

| Field | Value | Notes |
|---|---|---|
| Description | `Demo payment link` | Description for the link |
| Amount | `50.00` | Payment amount |
| Currency | `ZAR` | |

## SDK Classes Used

| Class | Purpose |
|---|---|
| `CreatePaymentLinkRequest` | Link creation request |
| `Iplv2paymentlinksOrderInformation` | Order details container |
| `Iplv2paymentlinksOrderInformationAmountDetails` | Amount and currency |
| `PblPaymentLinksPost201Response` | Creation response (link ID, status) |
