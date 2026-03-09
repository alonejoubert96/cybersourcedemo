---
title: Invoices
description: Create and send invoices to customers via email.
---

:::tip[Try it live]
**[Open Invoice Demo →](http://localhost:8080/checkout/invoice)** (requires `./gradlew bootRun`)
:::

The `InvoiceService` manages CyberSource invoices — creating them with customer and line-item details, and sending them to the customer's email. CyberSource handles the hosted payment page that the customer uses to pay.

## Operations Overview

| Operation | Description | Endpoint | SDK Method |
|---|---|---|---|
| **Create** | Creates a draft invoice | `POST /api/invoices` | `InvoicesApi.createInvoice()` |
| **Send** | Sends the invoice to the customer | `POST /api/invoices/{id}/send` | `InvoicesApi.performSendAction()` |
| **Get** | Retrieves invoice details | `GET /api/invoices/{id}` | `InvoicesApi.getInvoice()` |

## Data Flow — Create Invoice

```
POST /api/invoices
{                                InvoiceController              InvoiceService
  customerEmail,            ──▶  create(InvoiceRequest)    ──▶  createInvoice(request)
  description,                                                   │
  amount,                                                        ├─ ApiClientFactory.create()
  currency,                                                      │
  dueDate                                                        ├─ Build CreateInvoiceRequest
}                                                                │    ├─ customerInformation
                                                                 │    │    └─ .email(customerEmail)
                                                                 │    ├─ invoiceInformation
                                                                 │    │    ├─ .description(text)
                                                                 │    │    └─ .dueDate(LocalDate)
                                                                 │    └─ orderInformation
                                                                 │         ├─ amountDetails
                                                                 │         │    ├─ .totalAmount
                                                                 │         │    └─ .currency
                                                                 │         └─ lineItems[]
                                                                 │              ├─ .productName
                                                                 │              ├─ .unitPrice
                                                                 │              └─ .quantity(1)
                                                                 │
                                                                 ├─ InvoicesApi.createInvoice(request)
                                                                 │    └─ SDK: POST /invoicing/v2/invoices
                                                                 │
                                                                 └─ Map → PaymentResponse
                                                                      └─ details.invoiceId
```

### Date Handling

The SDK uses **Joda-Time** `LocalDate` for the due date. The service converts the ISO string from the DTO:

```java
// DTO has String dueDate (e.g. "2026-04-01")
if (request.getDueDate() != null) {
    invoiceInfo.dueDate(LocalDate.parse(request.getDueDate()));
}
```

## Data Flow — Send Invoice

```
POST /api/invoices/{invoiceId}/send

    │
    ▼
InvoiceService.sendInvoice(invoiceId)
    │
    ├─ ApiClientFactory.create()
    │
    ├─ InvoicesApi.performSendAction(invoiceId)
    │    └─ SDK: POST /invoicing/v2/invoices/{id}/send (publishes & emails)
    │
    └─ Map InvoicingV2InvoicesSend200Response → PaymentResponse
```

## Typical Flow: Create → Send

```
Step 1: Create Invoice              Step 2: Send Invoice
──────────────────────              ────────────────────
POST /api/invoices          ──▶     POST /api/invoices/{id}/send
                                    (use invoiceId from create)
Response:                           Response:
  status: "DRAFT"                     status: "SENT"
  transactionId: "inv-abc123"         message: "Invoice sent successfully"
  details.invoiceId: "inv-abc123"
```

## UI Demo

Navigate to [`http://localhost:8080/checkout/invoice`](http://localhost:8080/checkout/invoice) to try the create-then-send flow. All fields are pre-filled with valid [sandbox test data](/reference/test-data/).

### Walkthrough

1. **Create Invoice** — Click **Create Invoice** with the pre-filled email, description, and amount. The result appears inline showing the invoice ID.
2. **Send Invoice** — The invoice ID auto-fills into the Send form below. Click **Send Invoice** to email it to the customer via CyberSource's hosted payment page.
3. **Get Invoice** (optional) — The invoice ID also auto-fills into the Get form. Use this to retrieve and inspect invoice details.

## REST API Examples

### Create Invoice

```bash
curl -X POST http://localhost:8080/api/invoices \
  -H 'Content-Type: application/json' \
  -d '{
    "customerEmail": "test@example.com",
    "description": "Demo invoice item",
    "amount": 100.00,
    "currency": "USD",
    "dueDate": "2026-04-01"
  }'
```

### Send Invoice

```bash
curl -X POST http://localhost:8080/api/invoices/{invoiceId}/send
```

### Get Invoice

```bash
curl http://localhost:8080/api/invoices/{invoiceId}
```

## Test Data

| Field | Value | Notes |
|---|---|---|
| Customer Email | `test@example.com` | Receives the invoice email |
| Description | `Demo invoice item` | Shown as line item |
| Amount | `100.00` | Total invoice amount |
| Currency | `USD` | |
| Due Date | `2026-04-01` | ISO format (yyyy-MM-dd) |

## SDK Classes Used

| Class | Purpose |
|---|---|
| `CreateInvoiceRequest` | Invoice creation request |
| `Invoicingv2invoicesCustomerInformation` | Customer email |
| `Invoicingv2invoicesInvoiceInformation` | Description, due date |
| `Invoicingv2invoicesOrderInformation` | Amount + line items |
| `Invoicingv2invoicesOrderInformationAmountDetails` | Total amount, currency |
| `Invoicingv2invoicesOrderInformationLineItems` | Product name, unit price, quantity |
| `InvoicingV2InvoicesPost201Response` | Create response |
| `InvoicingV2InvoicesSend200Response` | Send response |
| `InvoicingV2InvoicesGet200Response` | Get response |
