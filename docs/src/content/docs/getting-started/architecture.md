---
title: Architecture
description: How the application components and CyberSource SDK fit together.
---

## High-Level Architecture

```
Browser / curl / Postman
        |
        v
Spring Boot (port 8080)
  |
  +-- controller/ui/  (Thymeleaf page routes)
  +-- controller/api/ (REST JSON endpoints)
        |
        v
  Service layer
    CardPaymentService, WalletPaymentService, EftPaymentService,
    TokenService, TokenizedPaymentService, InvoiceService,
    PaymentLinkService
        |
        v
  ApiClientFactory  -->  CybersourceConfig (application.yml)
        |
        v
  CyberSource REST Client SDK
    ApiClient + MerchantConfig + HTTP Signature auth
        |
        v
  apitest.cybersource.com (sandbox)
```

## Design Principles

### 1. One service per payment method

Each method gets its own service. The request shapes differ enough (cards vs bank accounts vs wallet tokens vs invoices) that a shared interface would just add indirection.

### 2. Fresh ApiClient per request

`ApiClient` is mutable — it stores the response code on the instance after each call, so it's not safe to reuse across requests. `ApiClientFactory` creates a new one every time.

```java
// ApiClientFactory.java
public ApiClient create() throws Exception {
    ApiClient apiClient = new ApiClient();
    MerchantConfig merchantConfig = new MerchantConfig(config.toSdkProperties());
    apiClient.merchantConfig = merchantConfig;
    return apiClient;
}
```

### 3. Shared PaymentResponse

Every endpoint returns the same `PaymentResponse` DTO. Method-specific fields go in the `details` map.

```java
@Data @Builder
public class PaymentResponse {
    private String status;        // e.g. "AUTHORIZED", "PENDING", "CREATED"
    private String transactionId; // CyberSource transaction/resource ID
    private String message;       // Human-readable result
    private int httpStatus;       // HTTP status from the SDK
    private Map<String, Object> details; // Additional data
}
```

### 4. Flat DTOs

Each method has its own request DTO — no inheritance. You can look at `EftPaymentRequest` and see exactly what fields EFT needs.

## Request Lifecycle

```
HTTP request → Controller → Service
  → ApiClientFactory.create() (fresh ApiClient + MerchantConfig)
  → build SDK request model (e.g. CreatePaymentRequest)
  → call SDK API method (e.g. PaymentsApi.createPayment)
  → map SDK response → PaymentResponse
  → return ResponseEntity<PaymentResponse>
```

## Authentication

The SDK signs each request automatically using HTTP Signature auth. Credentials come from `application.yml` → `CybersourceConfig` → `MerchantConfig` → `ApiClient`. The key fields are `merchantKeyId` (UUID) and `merchantsecretKey` (base64 shared secret).

## Error Handling

SDK `ApiException` → service wraps it in `PaymentException` (carries `statusCode` + `responseBody`) → `GlobalExceptionHandler` (`@ControllerAdvice`) returns a `PaymentResponse` with `status="ERROR"` and the appropriate HTTP status.

## SDK APIs Used

| SDK API Class | Operations | Used By |
|---|---|---|
| `PaymentsApi` | `createPayment()` | CardPaymentService, WalletPaymentService, EftPaymentService, TokenizedPaymentService |
| `CaptureApi` | `capturePayment()` | CardPaymentService |
| `RefundApi` | `refundCapture()` | CardPaymentService |
| `VoidApi` | `voidPayment()` | CardPaymentService |
| `InstrumentIdentifierApi` | `postInstrumentIdentifier()` | TokenService |
| `CustomerApi` | `postCustomer()` | TokenService |
| `CustomerPaymentInstrumentApi` | `postCustomerPaymentInstrument()` | TokenService |
| `InvoicesApi` | `createInvoice()`, `performSendAction()`, `getInvoice()` | InvoiceService |
| `PaymentLinksApi` | `createPaymentLink()` | PaymentLinkService |
