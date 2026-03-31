# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CyberShop — a Spring Boot 3.4 (Java 17) merchant web application with a product catalog, shopping cart, and CyberSource Unified Checkout payment integration.

## Build & Run

```bash
./gradlew build          # compile + test
./gradlew bootRun        # start on https://localhost:8080
./gradlew test           # run tests (JUnit 5)
./gradlew compileJava    # compile only, no tests
```

The app runs on HTTPS (self-signed cert). Navigate to `https://localhost:8080` and accept the certificate warning.

## Configuration

Merchant credentials are in `src/main/resources/application.yml` under the `app` prefix. Defaults point to the CyberSource sandbox (`apitest.cybersource.com`, merchant `vasdemosuc1`).

The capture context request payload is in `src/main/resources/request-payload.json` — controls allowed card networks, payment types, amount, and target origins.

## Architecture

**Layers:**

- `controller/ui/` — `CheckoutUiController` serves store pages and the checkout endpoint. On `/checkout`, it calls CyberSource to get a capture context JWT, extracts the client library URL, and passes everything to Thymeleaf.
- `service/` — `CaptureContextService` calls the CyberSource Unified Checkout API via the SDK. `JwtProcessorService` verifies JWTs against CyberSource's public key endpoint and extracts client library details.
- `model/` — `JWK` (JSON Web Key) and `RequestData` (payload + headers wrapper).
- `templates/` — Thymeleaf templates: `index.html` (product grid), `cart.html` (cart + order summary), `checkout.html` (order summary + Unified Checkout payment widgets).
- `templates/fragments/layout.html` — Shared navbar and CSS (Bootstrap 5 + custom styles).
- `static/js/store.js` — Client-side product catalog, cart management (localStorage), and checkout page rendering.

**Payment flow:**
1. User browses products → adds to cart → clicks "Proceed to Checkout"
2. Server calls CyberSource API to get a capture context JWT
3. JWT and client library info are injected into the checkout template
4. Unified Checkout JS renders payment widgets (card entry, Click to Pay, Google Pay, Apple Pay, eCheck)
5. On payment completion, a confirmation modal shows the transaction details

## CyberSource SDK Conventions

- SDK classes live in root-level packages: `Api.*`, `Model.*`, `Invokers.*` (from `cybersource-rest-client-java:0.0.76`).
- `ApiClient` is mutable and not thread-safe — a new one is created per request in `CaptureContextService`.
- Authentication uses HTTP Signature with merchant key ID and secret key.

## Tech Stack

- Java 17, Spring Boot 3.4.3, Gradle (Kotlin DSL)
- Lombok (`@Data`, `@Builder`, `@RequiredArgsConstructor`, `@Slf4j`)
- CyberSource REST Client Java SDK 0.0.76
- Auth0 Java JWT 4.2.1
- Thymeleaf + Bootstrap 5 (CDN)
- HTTPS with self-signed certificate (keystore.jks)
