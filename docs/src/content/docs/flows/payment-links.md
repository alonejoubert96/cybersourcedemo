---
title: Payment Links
description: Generate shareable payment URLs for easy checkout.
---

:::tip[Try it live]
**[Open Payment Links Demo →](http://localhost:8080/checkout/payment-link)** (requires `./gradlew bootRun`)
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

## UI Demo

Navigate to [`http://localhost:8080/checkout/payment-link`](http://localhost:8080/checkout/payment-link) to create a payment link. All fields are pre-filled with valid [sandbox test data](/reference/test-data/).

1. The description (`Demo payment link`), amount (`$50.00`), and currency are pre-populated
2. Click **Create Payment Link** — the result appears inline with the link ID and status

## REST API Example

```bash
curl -X POST http://localhost:8080/api/payment-links \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "Demo payment link",
    "amount": 50.00,
    "currency": "USD"
  }'
```

## Test Data

| Field | Value | Notes |
|---|---|---|
| Description | `Demo payment link` | Description for the link |
| Amount | `50.00` | Payment amount |
| Currency | `USD` | |

## SDK Classes Used

| Class | Purpose |
|---|---|
| `CreatePaymentLinkRequest` | Link creation request |
| `Iplv2paymentlinksOrderInformation` | Order details container |
| `Iplv2paymentlinksOrderInformationAmountDetails` | Amount and currency |
| `PblPaymentLinksPost201Response` | Creation response (link ID, status) |
