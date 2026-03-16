---
title: Digital Wallets
description: Google Pay, Apple Pay, and Samsung Pay payments through one service.
---

:::tip[Try it live]
**[Open Wallet Checkout →](http://localhost:8080/checkout?method=wallet)** — or use the legacy API test page at [`/demo/wallet`](http://localhost:8080/demo/wallet). Requires `./gradlew bootRun`.
:::

The `WalletPaymentService` handles all three digital wallets — **Google Pay**, **Apple Pay**, and **Samsung Pay** — through the same `PaymentsApi`. The only difference between them is the `paymentSolution` code sent to CyberSource.

## Wallet Types

| Wallet | Payment Solution Code | Enum Value |
|---|---|---|
| Google Pay | `012` | `GOOGLE_PAY` |
| Apple Pay | `001` | `APPLE_PAY` |
| Samsung Pay | `008` | `SAMSUNG_PAY` |

These codes are defined in the `WalletType` enum:

```java
@Getter @RequiredArgsConstructor
public enum WalletType {
    GOOGLE_PAY("012", "Google Pay"),
    APPLE_PAY("001", "Apple Pay"),
    SAMSUNG_PAY("008", "Samsung Pay");

    private final String paymentSolution;
    private final String displayName;
}
```

## API Endpoint

```
POST /api/payments/wallet/{type}
```

Where `{type}` is one of: `GOOGLE_PAY`, `APPLE_PAY`, `SAMSUNG_PAY`

## Data Flow

```
Client (JSON)                    WalletPaymentController          WalletPaymentService
─────────────                    ───────────────────────          ────────────────────
POST /api/payments/wallet/GOOGLE_PAY
{                           ──▶  pay("GOOGLE_PAY",          ──▶  pay(WalletType.GOOGLE_PAY, req)
  tokenData,                      WalletPaymentRequest)            │
  cryptogram,                                                      ├─ ApiClientFactory.create()
  expirationMonth,                                                 │
  expirationYear,                                                  ├─ Build CreatePaymentRequest
  amount,                                                          │    ├─ clientReferenceInformation.code
  currency                                                         │    ├─ processingInformation
}                                                                  │    │    └─ .paymentSolution("012")
                                                                   │    ├─ paymentInformation.tokenizedCard
                                                                   │    │    ├─ .number(tokenData)
                                                                   │    │    ├─ .expirationMonth / Year
                                                                   │    │    ├─ .cryptogram(cryptogram)
                                                                   │    │    └─ .transactionType("1")
                                                                   │    └─ orderInformation.amountDetails
                                                                   │
                                                                   ├─ PaymentsApi.createPayment(request)
                                                                   │    └─ SDK: POST /pts/v2/payments
                                                                   │
                                                                   └─ Map → PaymentResponse
```

### Key Difference from Card Payments

Wallets use `paymentInformation.tokenizedCard` instead of `paymentInformation.card`:

```java
// Card payment
Ptsv2paymentsPaymentInformationCard card = new ...;
card.number("4111111111111111");
paymentInfo.card(card);

// Wallet payment
Ptsv2paymentsPaymentInformationTokenizedCard tokenizedCard = new ...;
tokenizedCard.number(tokenData);
tokenizedCard.cryptogram(cryptogram);
tokenizedCard.transactionType("1");
paymentInfo.tokenizedCard(tokenizedCard);
```

The `processingInformation.paymentSolution` code tells CyberSource which wallet network to route through.

## UI Demo — Storefront Checkout

The wallet flow uses the **CyberShop checkout wizard** at [`/checkout?method=wallet`](http://localhost:8080/checkout?method=wallet):

1. Add products to your cart, go to cart, and click **Digital Wallet**
2. **Step 1: Contact Details** — Email and phone
3. **Step 2: Wallet Details** — Select provider (Google Pay, Apple Pay, Samsung Pay), token data, cryptogram. All pre-filled.
4. **Step 3: Review & Confirm** — Click **Digital Wallet** to submit
5. **Order Confirmation** — Shows transaction details

:::tip
The only difference between the three wallets in the API call is the `paymentSolution` code. Try switching wallet types to see this in action.
:::

The legacy API test page is available at [`/demo/wallet`](http://localhost:8080/demo/wallet).

## REST API Examples

### Google Pay

```bash
curl -X POST http://localhost:8080/api/payments/wallet/GOOGLE_PAY \
  -H 'Content-Type: application/json' \
  -d '{
    "tokenData": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2026",
    "cryptogram": "ABCDEFabcdef1234567890ABCDEF=",
    "amount": 25.00,
    "currency": "ZAR"
  }'
```

### Apple Pay

```bash
curl -X POST http://localhost:8080/api/payments/wallet/APPLE_PAY \
  -H 'Content-Type: application/json' \
  -d '{
    "tokenData": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2026",
    "cryptogram": "ABCDEFabcdef1234567890ABCDEF=",
    "amount": 25.00,
    "currency": "ZAR"
  }'
```

### Samsung Pay

```bash
curl -X POST http://localhost:8080/api/payments/wallet/SAMSUNG_PAY \
  -H 'Content-Type: application/json' \
  -d '{
    "tokenData": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2026",
    "cryptogram": "ABCDEFabcdef1234567890ABCDEF=",
    "amount": 25.00,
    "currency": "ZAR"
  }'
```

## Test Data

| Field | Value | Notes |
|---|---|---|
| Token Data | `4111111111111111` | Simulates the DPAN from the wallet |
| Expiration Month | `12` | |
| Expiration Year | `2026` | |
| Cryptogram | `ABCDEFabcdef1234567890ABCDEF=` | Base64 network cryptogram |
| Amount | Any positive number | e.g. `25.00` |
| Currency | `ZAR` | |

:::note
In production, the `tokenData` and `cryptogram` come from the wallet SDK (Google Pay API, Apple Pay JS, Samsung Pay SDK). For this sandbox demo, test values are used directly.
:::

## SDK Classes Used

| Class | Purpose |
|---|---|
| `CreatePaymentRequest` | Payment request body |
| `Ptsv2paymentsProcessingInformation` | Carries `paymentSolution` code |
| `Ptsv2paymentsPaymentInformationTokenizedCard` | Wallet token data + cryptogram |
| `Ptsv2paymentsOrderInformationAmountDetails` | Amount and currency |
| `PtsV2PaymentsPost201Response` | Payment response |
