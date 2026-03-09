---
title: Architecture
description: How the application components and CyberSource SDK fit together.
---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────────┐           ┌───────────────────────┐       │
│  │  Thymeleaf UI    │           │  REST API Consumers   │       │
│  │  (Bootstrap 5)   │           │  (curl, Postman, etc) │       │
│  └────────┬─────────┘           └───────────┬───────────┘       │
│           │ HTML forms + fetch()             │ JSON              │
└───────────┼──────────────────────────────────┼──────────────────┘
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Spring Boot Application                    │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │ CheckoutUi       │    │ REST Controllers (api/)           │   │
│  │ Controller       │    │  CardPaymentController            │   │
│  │ (Thymeleaf       │    │  WalletPaymentController          │   │
│  │  routing)        │    │  EftPaymentController             │   │
│  └──────────────────┘    │  TokenController                  │   │
│                          │  InvoiceController                │   │
│                          │  PaymentLinkController            │   │
│                          └──────────┬───────────────────────┘   │
│                                     │                           │
│                                     ▼                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Service Layer                          │   │
│  │  CardPaymentService    WalletPaymentService               │   │
│  │  EftPaymentService     TokenService                       │   │
│  │  TokenizedPaymentService  InvoiceService                  │   │
│  │  PaymentLinkService    PayPalPaymentService (stub)        │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SDK Integration Layer                        │   │
│  │  ┌──────────────────┐    ┌──────────────────────────┐    │   │
│  │  │ ApiClientFactory │───▶│ CybersourceConfig        │    │   │
│  │  │ (per-request)    │    │ (@ConfigurationProperties)│   │   │
│  │  └────────┬─────────┘    └──────────────────────────┘    │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │         CyberSource REST Client SDK              │    │   │
│  │  │  ApiClient → MerchantConfig → HTTP Signature     │    │   │
│  │  │  PaymentsApi, CaptureApi, RefundApi, VoidApi     │    │   │
│  │  │  CustomerApi, InstrumentIdentifierApi            │    │   │
│  │  │  InvoicesApi, PaymentLinksApi                     │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS (HTTP Signature Auth)
                    ┌─────────────────────┐
                    │  CyberSource API    │
                    │  (apitest.cyber     │
                    │   source.com)       │
                    └─────────────────────┘
```

## Design Principles

### 1. Separate Services — No Strategy Pattern

Each payment method has a dedicated service class. The request shapes are fundamentally different across payment types (cards vs. bank accounts vs. wallet tokens vs. invoices), so a shared interface would add indirection without reducing code. For a demo, explicit code is clearer than abstraction.

### 2. ApiClient Created Per-Request

The CyberSource SDK's `ApiClient` is **mutable and not thread-safe** — it stores response codes and status on instance fields after each call. `ApiClientFactory` creates a fresh `ApiClient` for every API call, which matches the pattern used in CyberSource's own sample code.

```java
// ApiClientFactory.java
public ApiClient create() throws Exception {
    ApiClient apiClient = new ApiClient();
    MerchantConfig merchantConfig = new MerchantConfig(config.toSdkProperties());
    apiClient.merchantConfig = merchantConfig;
    return apiClient;
}
```

### 3. Universal PaymentResponse

All operations return the same `PaymentResponse` shape regardless of payment method. The `details` map handles method-specific extras (reconciliation IDs, customer IDs, etc.).

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

Each payment method has its own request DTO with no inheritance hierarchy. This keeps each flow self-documenting — you can look at `EftPaymentRequest` and immediately know what fields EFT needs without tracing through a class hierarchy.

## Request Lifecycle

Every API request follows this lifecycle:

```
1. HTTP Request arrives at REST Controller
         │
2. Controller delegates to Service
         │
3. Service calls ApiClientFactory.create()
   └─▶ Creates fresh ApiClient
   └─▶ Loads MerchantConfig from CybersourceConfig (application.yml)
         │
4. Service builds SDK request model
   └─▶ Creates request object (e.g. CreatePaymentRequest)
   └─▶ Sets sub-models (card info, amount, billing address, etc.)
         │
5. Service calls SDK API method
   └─▶ e.g. PaymentsApi.createPayment(request)
   └─▶ SDK handles HTTP Signature auth, serialization, HTTP call
         │
6. Service reads SDK response
   └─▶ Maps to PaymentResponse DTO
   └─▶ Returns to controller
         │
7. Controller returns ResponseEntity<PaymentResponse>
```

## Authentication Flow

The SDK handles authentication automatically using **HTTP Signature**:

```
CybersourceConfig (application.yml)
    │
    ▼
Properties object
    ├── merchantID: "testrest"
    ├── runEnvironment: "apitest.cybersource.com"
    ├── authenticationType: "http_signature"
    ├── merchantKeyId: UUID (identifies the key)
    └── merchantsecretKey: Base64 (shared secret)
    │
    ▼
MerchantConfig
    │
    ▼
ApiClient.merchantConfig
    │
    ▼
SDK generates HTTP Signature header for each request
    │
    ▼
CyberSource API validates signature and processes request
```

## Error Handling

```
SDK throws ApiException
    │
    ▼
Service catches and wraps in PaymentException
    ├── statusCode (HTTP status from CyberSource)
    └── responseBody (raw error JSON)
    │
    ▼
GlobalExceptionHandler (@ControllerAdvice)
    │
    ▼
PaymentResponse with status="ERROR"
    │
    ▼
HTTP response with appropriate status code
```

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
