---
title: EFT / eCheck
description: ACH bank account payments using routing and account numbers.
---

:::tip[Try it live]
**[Open EFT Checkout →](http://localhost:8080/checkout?method=eft)** — or use the legacy API test page at [`/demo/eft`](http://localhost:8080/demo/eft). Requires `./gradlew bootRun`.
:::

The `EftPaymentService` processes **eCheck / ACH** payments by debiting a bank account directly. It uses the same `PaymentsApi` as card payments but sends bank account information instead of card details, with the payment type set to `CHECK`.

## API Endpoint

```
POST /api/payments/eft
```

## Data Flow

```
Client (JSON)                    EftPaymentController             EftPaymentService
─────────────                    ────────────────────             ─────────────────
POST /api/payments/eft
{                           ──▶  pay(EftPaymentRequest)     ──▶  pay(request)
  routingNumber,                                                   │
  accountNumber,                                                   ├─ ApiClientFactory.create()
  accountType,                                                     │
  firstName,                                                       ├─ Build CreatePaymentRequest
  lastName,                                                        │    ├─ clientReferenceInformation.code
  amount,                                                          │    ├─ paymentInformation
  currency                                                         │    │    ├─ .bank.account
}                                                                  │    │    │    ├─ .number(accountNumber)
                                                                   │    │    │    └─ .type("C" or "S")
                                                                   │    │    ├─ .bank.routingNumber
                                                                   │    │    └─ .paymentType.name("CHECK")
                                                                   │    └─ orderInformation
                                                                   │         ├─ amountDetails
                                                                   │         └─ billTo
                                                                   │
                                                                   ├─ PaymentsApi.createPayment(request)
                                                                   │    └─ SDK: POST /pts/v2/payments
                                                                   │
                                                                   └─ Map → PaymentResponse
```

### Key Difference from Card Payments

EFT uses bank information and a `CHECK` payment type instead of card details:

```java
// Bank account info
Ptsv2paymentsPaymentInformationBank bank = new ...;
Ptsv2paymentsPaymentInformationBankAccount bankAccount = new ...;
bankAccount.number("4100");          // Account number
bankAccount.type("C");               // C=Checking, S=Savings
bank.account(bankAccount);
bank.routingNumber("121042882");     // ABA routing number

// Payment type = CHECK
Ptsv2paymentsPaymentInformationPaymentType paymentType = new ...;
paymentType.name("CHECK");
paymentInfo.paymentType(paymentType);
```

## UI Demo — Storefront Checkout

The EFT flow uses the **CyberShop checkout wizard** at [`/checkout?method=eft`](http://localhost:8080/checkout?method=eft):

1. Add products to your cart, go to cart, and click **Bank Transfer (EFT)**
2. **Step 1: Contact Details** — Email and phone
3. **Step 2: Bank Account Details** — Routing number, account number, account type, billing address. All pre-filled.
4. **Step 3: Review & Confirm** — Click **Bank Transfer** to submit
5. **Order Confirmation** — Shows transaction details

:::note
The CyberSource sandbox requires **USD** for ACH/eCheck transactions. The storefront displays prices in ZAR but sends USD to the API for EFT payments.
:::

The legacy API test page is available at [`/demo/eft`](http://localhost:8080/demo/eft).

## REST API Example

```bash
curl -X POST http://localhost:8080/api/payments/eft \
  -H 'Content-Type: application/json' \
  -d '{
    "routingNumber": "121042882",
    "accountNumber": "4100",
    "accountType": "C",
    "firstName": "John",
    "lastName": "Doe",
    "amount": 25.00,
    "currency": "USD"
  }'
```

## Test Data

| Field | Value | Notes |
|---|---|---|
| Routing Number | `121042882` | CyberSource test ABA routing |
| Account Number | `4100` | Test account number |
| Account Type | `C` | `C` = Checking, `S` = Savings |
| First Name | `John` | |
| Last Name | `Doe` | |
| Amount | Any positive number | e.g. `25.00` |
| Currency | `USD` | |

## Request DTO

```java
@Data
public class EftPaymentRequest {
    private String accountNumber;
    private String routingNumber;
    private String accountType = "C"; // C=checking, S=savings
    private String firstName;
    private String lastName;
    private String email;
    private double amount;
    private String currency = "USD";
}
```

## SDK Classes Used

| Class | Purpose |
|---|---|
| `CreatePaymentRequest` | Payment request body |
| `Ptsv2paymentsPaymentInformationBank` | Bank container |
| `Ptsv2paymentsPaymentInformationBankAccount` | Account number + type |
| `Ptsv2paymentsPaymentInformationPaymentType` | Set to `CHECK` for ACH |
| `Ptsv2paymentsOrderInformationBillTo` | Billing address (required for eCheck) |
| `PtsV2PaymentsPost201Response` | Payment response |
