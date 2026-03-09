# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CyberSource payment integration demo — a Spring Boot 3.4 (Java 17) web app that demonstrates multiple CyberSource payment methods via REST APIs with a Thymeleaf UI.

## Build & Run

```bash
./gradlew build          # compile + test
./gradlew bootRun        # start on http://localhost:8080
./gradlew test           # run tests (JUnit 5)
./gradlew compileJava    # compile only, no tests
```

## Configuration

Credentials are in `src/main/resources/application.yml` under the `cybersource` prefix, with env-var overrides `CYBERSOURCE_KEY_ID` and `CYBERSOURCE_SECRET_KEY`. Defaults point to the CyberSource sandbox (`apitest.cybersource.com`, merchant `testrest`).

## Architecture

**SDK integration pattern:** `CybersourceConfig` (Spring `@ConfigurationProperties`) → `ApiClientFactory` (creates a fresh, non-thread-safe `ApiClient` per request) → service classes that build SDK model objects and call CyberSource API classes.

**Layers:**

- `config/` — `CybersourceConfig` binds `cybersource.*` properties and converts them to SDK `Properties` via `toSdkProperties()`.
- `sdk/` — `ApiClientFactory` creates per-request `ApiClient` instances wired with `MerchantConfig`.
- `service/` — One service per payment method. Each service injects `ApiClientFactory`, builds SDK request models, calls the SDK API, and returns a `PaymentResponse`.
- `controller/api/` — REST controllers (all under `/api/`) delegate to services. Thin layer, no business logic.
- `dto/` — Request/response POJOs. `PaymentResponse` uses Lombok `@Builder`; requests use `@Data`.
- `exception/` — `PaymentException` wraps SDK `ApiException` details; `GlobalExceptionHandler` (`@ControllerAdvice`) catches and returns structured error responses.

**API routes:**

| Prefix | Controller | Operations |
|---|---|---|
| `/api/payments/card` | CardPaymentController | authorize, sale, capture, refund, void |
| `/api/payments/wallet/{type}` | WalletPaymentController | Google Pay, Apple Pay, Samsung Pay |
| `/api/payments/eft` | EftPaymentController | ACH/eCheck |
| `/api/tokens` | TokenController | store card (creates instrument identifier + customer + payment instrument), pay with token |
| `/api/invoices` | InvoiceController | create, send, get |
| `/api/payment-links` | PaymentLinkController | create |

**UI:** Thymeleaf templates in `src/main/resources/templates/` with Bootstrap 5. `fragments/layout.html` provides shared head/navbar. `index.html` is the landing page with links to each payment method.

**Docs site:** `docs/` contains a separate Astro/Starlight documentation project (not part of the Java build).

## CyberSource SDK Conventions

- SDK classes live in root-level packages: `Api.*`, `Model.*`, `Invokers.*` (from `cybersource-rest-client-java:0.0.86`).
- Model class names are long and non-intuitive (e.g., `Ptsv2paymentsOrderInformationAmountDetails`). Use existing services as reference when building new SDK calls.
- `ApiClient` is mutable and not thread-safe — always create a new one per request via `ApiClientFactory.create()`.
- SDK errors surface as `Invokers.ApiException` with `getCode()` (HTTP status) and `getResponseBody()`.

## Tech Stack

- Java 17, Spring Boot 3.4.3, Gradle (Kotlin DSL)
- Lombok (`@Data`, `@Builder`, `@RequiredArgsConstructor`, `@Slf4j`)
- CyberSource REST Client Java SDK 0.0.86
- Thymeleaf + Bootstrap 5 (CDN)
