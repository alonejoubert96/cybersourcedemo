---
title: API Endpoints
description: Complete reference of all REST API endpoints.
---

All REST endpoints return a `PaymentResponse` JSON object:

```json
{
  "status": "AUTHORIZED",
  "transactionId": "7025767922626364104953",
  "message": "Authorization successful",
  "httpStatus": 201,
  "details": { "reconciliationId": "..." }
}
```

## Card Payments

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/payments/card/authorize` | Authorize (hold funds) | [PaymentRequest](#paymentrequest) |
| POST | `/api/payments/card/sale` | Sale (auth + capture) | [PaymentRequest](#paymentrequest) |
| POST | `/api/payments/card/{id}/capture` | Capture an authorization | `{ amount, currency }` |
| POST | `/api/payments/card/{id}/refund` | Refund a capture | `{ amount, currency }` |
| POST | `/api/payments/card/{id}/void` | Void an authorization | _(empty body)_ |

[Card Payments flow →](/flows/card-payments/)

## Digital Wallets

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/payments/wallet/GOOGLE_PAY` | Google Pay payment | [WalletPaymentRequest](#walletpaymentrequest) |
| POST | `/api/payments/wallet/APPLE_PAY` | Apple Pay payment | [WalletPaymentRequest](#walletpaymentrequest) |
| POST | `/api/payments/wallet/SAMSUNG_PAY` | Samsung Pay payment | [WalletPaymentRequest](#walletpaymentrequest) |

[Digital Wallets flow →](/flows/digital-wallets/)

## EFT / eCheck

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/payments/eft` | ACH bank debit | [EftPaymentRequest](#eftpaymentrequest) |

[EFT / eCheck flow →](/flows/eft-echeck/)

## Tokenized Payments

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/tokens/customers` | Store card for returning shoppers | [TokenRequest](#tokenrequest) |
| POST | `/api/tokens/pay` | Pay with stored customer token | `{ customerId, amount, currency }` |

[Tokenized Payments flow →](/flows/tokenized-payments/)

## Invoices

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/invoices` | Create a draft invoice | [InvoiceRequest](#invoicerequest) |
| POST | `/api/invoices/{id}/send` | Send invoice to customer | _(empty body)_ |
| GET | `/api/invoices/{id}` | Retrieve invoice details | _(none)_ |

[Invoices flow →](/flows/invoices/)

## Payment Links

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/payment-links` | Create a payment link | [PaymentLinkRequest](#paymentlinkrequest) |

[Payment Links flow →](/flows/payment-links/)

---

## Request DTOs

### PaymentRequest

```json
{
  "cardNumber": "4111111111111111",
  "expirationMonth": "12",
  "expirationYear": "2031",
  "securityCode": "123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "test@example.com",
  "amount": 25.00,
  "currency": "USD"
}
```

### WalletPaymentRequest

```json
{
  "tokenData": "4111111111111111",
  "cryptogram": "ABCDEFabcdef1234567890ABCDEF=",
  "expirationMonth": "12",
  "expirationYear": "2026",
  "amount": 25.00,
  "currency": "USD"
}
```

### EftPaymentRequest

```json
{
  "routingNumber": "121042882",
  "accountNumber": "4100",
  "accountType": "C",
  "firstName": "John",
  "lastName": "Doe",
  "email": "test@example.com",
  "amount": 25.00,
  "currency": "USD"
}
```

### TokenRequest

```json
{
  "cardNumber": "4111111111111111",
  "expirationMonth": "12",
  "expirationYear": "2031",
  "firstName": "John",
  "lastName": "Doe",
  "email": "test@example.com"
}
```

### InvoiceRequest

```json
{
  "customerEmail": "test@example.com",
  "description": "Demo invoice item",
  "amount": 100.00,
  "currency": "USD",
  "dueDate": "2026-04-01"
}
```

### PaymentLinkRequest

```json
{
  "description": "Demo payment link",
  "amount": 50.00,
  "currency": "USD"
}
```
