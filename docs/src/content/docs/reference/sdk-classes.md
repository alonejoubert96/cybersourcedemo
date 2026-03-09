---
title: SDK Class Reference
description: CyberSource REST Client Java SDK classes used in this demo.
---

This reference covers the SDK classes used by the demo application. The SDK uses auto-generated model classes from the CyberSource OpenAPI specification.

## SDK Coordinates

```
com.cybersource:cybersource-rest-client-java:0.0.86
```

Transitive dependency:
```
com.cybersource:AuthenticationSdk:0.0.41
```

## Package Structure

| Package | Contents |
|---|---|
| `Api.*` | API endpoint classes (one per CyberSource resource) |
| `Model.*` | Request/response model classes |
| `Invokers.ApiClient` | Central HTTP client (mutable, not thread-safe) |
| `Invokers.ApiException` | SDK HTTP error wrapper |
| `com.cybersource.authsdk.core.MerchantConfig` | Auth configuration (in AuthenticationSdk) |

## API Classes

### PaymentsApi

Used by: `CardPaymentService`, `WalletPaymentService`, `EftPaymentService`, `TokenizedPaymentService`

```java
PaymentsApi api = new PaymentsApi(apiClient);
PtsV2PaymentsPost201Response result = api.createPayment(createPaymentRequest);
```

- **Method**: `createPayment(CreatePaymentRequest)` → `PtsV2PaymentsPost201Response`
- **SDK endpoint**: `POST /pts/v2/payments`

### CaptureApi

Used by: `CardPaymentService`

```java
CaptureApi api = new CaptureApi(apiClient);
PtsV2PaymentsCapturesPost201Response result = api.capturePayment(captureRequest, paymentId);
```

- **Method**: `capturePayment(CapturePaymentRequest, String id)` → `PtsV2PaymentsCapturesPost201Response`
- **SDK endpoint**: `POST /pts/v2/payments/{id}/captures`

### RefundApi

Used by: `CardPaymentService`

```java
RefundApi api = new RefundApi(apiClient);
PtsV2PaymentsRefundPost201Response result = api.refundCapture(refundRequest, captureId);
```

- **Methods**:
  - `refundCapture(RefundCaptureRequest, String id)` — refund a captured payment
  - `refundPayment(RefundPaymentRequest, String id)` — refund a payment directly

### VoidApi

Used by: `CardPaymentService`

```java
VoidApi api = new VoidApi(apiClient);
PtsV2PaymentsVoidsPost201Response result = api.voidPayment(voidRequest, paymentId);
```

- **Method**: `voidPayment(VoidPaymentRequest, String id)` → `PtsV2PaymentsVoidsPost201Response`
- Also supports: `voidCapture()`, `voidCredit()`, `voidRefund()`

### InstrumentIdentifierApi

Used by: `TokenService`

```java
InstrumentIdentifierApi api = new InstrumentIdentifierApi(apiClient);
PostInstrumentIdentifierRequest result = api.postInstrumentIdentifier(request, null, null);
```

- **Method**: `postInstrumentIdentifier(PostInstrumentIdentifierRequest, String, Boolean)` → `PostInstrumentIdentifierRequest`
- **SDK endpoint**: `POST /tms/v1/instrumentidentifiers`

### CustomerApi

Used by: `TokenService`

```java
CustomerApi api = new CustomerApi(apiClient);
PostCustomerRequest result = api.postCustomer(request, null);
```

- **Method**: `postCustomer(PostCustomerRequest, String profileId)` → `PostCustomerRequest`
- **SDK endpoint**: `POST /tms/v2/customers`
- Note: Return type reuses the request model (SDK quirk)

### CustomerPaymentInstrumentApi

Used by: `TokenService`

```java
CustomerPaymentInstrumentApi api = new CustomerPaymentInstrumentApi(apiClient);
PostCustomerPaymentInstrumentRequest result =
    api.postCustomerPaymentInstrument(customerId, request, null);
```

- **Method**: `postCustomerPaymentInstrument(String customerId, PostCustomerPaymentInstrumentRequest, String profileId)` → `PostCustomerPaymentInstrumentRequest`
- **SDK endpoint**: `POST /tms/v2/customers/{id}/payment-instruments`

### InvoicesApi

Used by: `InvoiceService`

```java
InvoicesApi api = new InvoicesApi(apiClient);
InvoicingV2InvoicesPost201Response createResult = api.createInvoice(request);
InvoicingV2InvoicesSend200Response sendResult = api.performSendAction(invoiceId);
InvoicingV2InvoicesGet200Response getResult = api.getInvoice(invoiceId);
```

### PaymentLinksApi

Used by: `PaymentLinkService`

```java
PaymentLinksApi api = new PaymentLinksApi(apiClient);
PblPaymentLinksPost201Response result = api.createPaymentLink(request);
```

- **Method**: `createPaymentLink(CreatePaymentLinkRequest)` → `PblPaymentLinksPost201Response`
- **SDK endpoint**: `POST /ipl/v2/payment-links`

## Model Naming Convention

SDK model classes follow a predictable naming pattern:

```
Ptsv2payments[SubResource][Section]
│      │          │          │
│      │          │          └─ e.g. AmountDetails, BillTo, Card
│      │          └─ e.g. idcaptures, idrefunds, idreversals
│      └─ API version (v2)
└─ Service prefix (pts = Payment Transaction Services)
```

### Examples

| Class | Meaning |
|---|---|
| `Ptsv2paymentsPaymentInformationCard` | Card info for a payment |
| `Ptsv2paymentsidcapturesOrderInformationAmountDetails` | Amount details for a capture |
| `Ptsv2paymentsidrefundsClientReferenceInformation` | Client reference for a refund |
| `Ptsv2paymentsidreversalsClientReferenceInformation` | Client reference for a void |
| `Invoicingv2invoicesOrderInformationLineItems` | Line items for an invoice |
| `Iplv2paymentlinksOrderInformationAmountDetails` | Amount details for a payment link |
| `Tmsv2tokenize...` | Token Management Service models |

:::note
Each operation (payment, capture, refund, void) has its **own set of model classes** even when the field structures are similar. This is because the SDK is auto-generated from the OpenAPI spec where each endpoint has distinct schemas.
:::

## ApiClient Usage

```java
// Create client
ApiClient apiClient = new ApiClient();

// Set merchant config (from AuthenticationSdk)
MerchantConfig merchantConfig = new MerchantConfig(properties);
apiClient.merchantConfig = merchantConfig;

// After API call, read response metadata
String responseCode = apiClient.responseCode;  // e.g. "201"
String status = apiClient.status;              // e.g. "AUTHORIZED"
```

:::caution
`ApiClient` stores mutable state (`responseCode`, `status`) on instance fields. It is **not thread-safe** — always create a new instance per API call.
:::

## ApiException

```java
try {
    api.createPayment(request);
} catch (Invokers.ApiException e) {
    int httpStatus = e.getCode();         // e.g. 400, 401, 500
    String body = e.getResponseBody();     // Raw JSON error response
    String message = e.getMessage();       // Error description
}
```
