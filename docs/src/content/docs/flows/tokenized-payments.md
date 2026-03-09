---
title: Tokenized Payments
description: Store cards for returning shoppers and pay with customer tokens.
---

:::tip[Try it live]
**[Open Tokenized Payments Demo →](http://localhost:8080/checkout/token)** (requires `./gradlew bootRun`)
:::

Tokenized payments use CyberSource's **Token Management Service (TMS)** to securely store card details and charge them later without resending the full card number. This is a two-phase flow: **store** the card, then **pay** with the token.

## Operations Overview

| Operation | Description | Endpoint | SDK APIs |
|---|---|---|---|
| **Store Card** | Creates instrument identifier, customer, and payment instrument | `POST /api/tokens/customers` | `InstrumentIdentifierApi` + `CustomerApi` + `CustomerPaymentInstrumentApi` |
| **Pay with Token** | Charges a stored customer token | `POST /api/tokens/pay` | `PaymentsApi` |

## Data Flow — Store Card (3-Step Process)

Storing a card requires three sequential API calls:

```
POST /api/tokens/customers
{ cardNumber, expirationMonth, expirationYear, email }

    │
    ▼
TokenService.storeCustomerCard(request)
    │
    ├─── Step 1: Create Instrument Identifier ─────────────────┐
    │    ApiClient #1 (fresh)                                   │
    │    PostInstrumentIdentifierRequest                        │
    │      └─ card.number("4111111111111111")                   │
    │    InstrumentIdentifierApi.postInstrumentIdentifier()     │
    │      └─ SDK: POST /tms/v1/instrumentidentifiers          │
    │    Returns: instrumentIdentifierId                        │
    │                                                           │
    ├─── Step 2: Create Customer ──────────────────────────────┤
    │    ApiClient #2 (fresh)                                   │
    │    PostCustomerRequest                                    │
    │      └─ buyerInformation.email("test@example.com")        │
    │    CustomerApi.postCustomer()                             │
    │      └─ SDK: POST /tms/v2/customers                      │
    │    Returns: customerId                                    │
    │                                                           │
    ├─── Step 3: Add Payment Instrument to Customer ───────────┤
    │    ApiClient #3 (fresh)                                   │
    │    PostCustomerPaymentInstrumentRequest                   │
    │      ├─ card.expirationMonth / Year                       │
    │      ├─ instrumentIdentifier.id(instrumentIdentifierId)   │
    │      └─ billTo (name, address)                            │
    │    CustomerPaymentInstrumentApi                           │
    │      .postCustomerPaymentInstrument(customerId, req)      │
    │      └─ SDK: POST /tms/v2/customers/{id}/payment-instruments
    │    Returns: paymentInstrumentId                           │
    │                                                           │
    └─── Response ─────────────────────────────────────────────┘
         PaymentResponse
           status: "CREATED"
           transactionId: customerId
           details: { customerId, paymentInstrumentId }
```

:::note
Three separate `ApiClient` instances are created — one per SDK call — because `ApiClient` is mutable and not thread-safe.
:::

### Why Three Steps?

The TMS separates concerns:
1. **Instrument Identifier** — stores the raw card number (PAN) and returns a secure reference
2. **Customer** — represents the shopper (email, buyer info)
3. **Payment Instrument** — links the card (via instrument identifier) to the customer with billing details

## Data Flow — Pay with Token

```
POST /api/tokens/pay
{ customerId, amount, currency }

    │
    ▼
TokenizedPaymentService.payWithToken(customerId, amount, currency)
    │
    ├─ ApiClientFactory.create()
    │
    ├─ Build CreatePaymentRequest
    │    ├─ clientReferenceInformation.code
    │    ├─ processingInformation.capture(true)  ← sale (auth+capture)
    │    ├─ paymentInformation
    │    │    └─ .customer.id(customerId)  ← just the token, no card details
    │    └─ orderInformation.amountDetails
    │
    ├─ PaymentsApi.createPayment(request)
    │    └─ SDK: POST /pts/v2/payments
    │
    └─ Map → PaymentResponse
```

### Key: No Card Details Needed

When paying with a stored token, you only send the `customerId` — CyberSource retrieves the card from TMS:

```java
Ptsv2paymentsPaymentInformationCustomer customer = new ...;
customer.id(customerId);  // That's it — no card number, no expiry
paymentInfo.customer(customer);
```

## UI Demo

Navigate to [`http://localhost:8080/checkout/token`](http://localhost:8080/checkout/token) to try the full store-then-pay flow. All fields are pre-filled with valid [sandbox test data](/reference/test-data/).

### Walkthrough

1. **Store Card** — Click **Store Card** with the pre-filled Visa test card. The result appears inline showing the `customerId` and `paymentInstrumentId`.
2. **Pay with Token** — The `customerId` auto-fills into the Pay form below. Click **Pay with Token** to charge the stored card — no card details needed, just the token.

## REST API Examples

### Store Card

```bash
curl -X POST http://localhost:8080/api/tokens/customers \
  -H 'Content-Type: application/json' \
  -d '{
    "cardNumber": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2031",
    "email": "test@example.com"
  }'
```

**Response:**
```json
{
  "status": "CREATED",
  "transactionId": "ABC123DEF456",
  "message": "Customer and payment instrument stored successfully",
  "httpStatus": 201,
  "details": {
    "customerId": "ABC123DEF456",
    "paymentInstrumentId": "GHI789JKL012"
  }
}
```

### Pay with Token

```bash
curl -X POST http://localhost:8080/api/tokens/pay \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "ABC123DEF456",
    "amount": 25.00,
    "currency": "USD"
  }'
```

## Test Data

| Field | Value | Notes |
|---|---|---|
| Card Number | `4111111111111111` | Visa test card |
| Expiration Month | `12` | |
| Expiration Year | `2031` | |
| Email | `test@example.com` | |
| Amount (for pay) | Any positive number | e.g. `25.00` |
| Customer ID (for pay) | From store response | Copy `transactionId` from store |

## SDK Classes Used

### Store Card

| Class | Purpose |
|---|---|
| `PostInstrumentIdentifierRequest` | Store card number |
| `TmsEmbeddedInstrumentIdentifierCard` | Card number for instrument identifier |
| `PostCustomerRequest` | Create customer record |
| `Tmsv2tokenizeTokenInformationCustomerBuyerInformation` | Customer email |
| `PostCustomerPaymentInstrumentRequest` | Link card to customer |
| `Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentCard` | Card expiry |
| `Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentBillTo` | Billing address |
| `Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentInstrumentIdentifier` | Link to instrument ID |

### Pay with Token

| Class | Purpose |
|---|---|
| `CreatePaymentRequest` | Payment request body |
| `Ptsv2paymentsPaymentInformationCustomer` | Customer token reference |
| `PtsV2PaymentsPost201Response` | Payment response |
