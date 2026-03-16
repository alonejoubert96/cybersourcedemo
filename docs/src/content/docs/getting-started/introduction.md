---
title: Introduction
description: Overview of the CyberShop Payment Demo application.
---

A **Spring Boot** demo app that integrates with the CyberSource REST API. It has a small storefront (product catalog, cart, checkout wizard) backed by REST endpoints that hit the CyberSource sandbox.

## What's Included

| Payment Method | Description |
|---|---|
| [Card Payments](/flows/card-payments/) | Authorize, sale (auth+capture), capture, refund, void |
| [Digital Wallets](/flows/digital-wallets/) | Google Pay, Apple Pay, Samsung Pay |
| [EFT / eCheck](/flows/eft-echeck/) | ACH bank account debits |
| [Tokenized Payments](/flows/tokenized-payments/) | Store cards & pay with customer tokens |
| [Invoices](/flows/invoices/) | Create & send invoices |
| [Payment Links](/flows/payment-links/) | Generate shareable payment URLs |
| PayPal | Coming soon (stub) |

## Tech Stack

- **Java 17** + **Spring Boot 3.4.3** + **Gradle (Kotlin DSL)**
- **Lombok** for boilerplate reduction
- **CyberSource REST Client Java SDK 0.0.86**
- **Thymeleaf** + **Bootstrap 5** + **Bootstrap Icons** for the storefront UI
- **Currency:** ZAR (South African Rand) — displayed as `R`

## Quick Start

```bash
# Clone the repository and enter the project directory
cd "Cybersource Demo"

# Run the application
./gradlew bootRun

# The app starts on port 8080
# Open http://localhost:8080 in your browser
```

The landing page shows a product catalog. Add items to cart, pick a payment method, and go through the checkout wizard. Forms are pre-filled with [sandbox test data](/reference/test-data/).

## Checkout Flow

```
Product Catalog (/)  →  Cart (/cart)  →  Checkout Wizard (/checkout?method=card)
                                          Step 1: Contact Details (email, phone)
                                          Step 2: Payment Details + Billing Address
                                          Step 3: Review & Confirm
                                          → Order Confirmation
```

Each completed step collapses into a summary with an **Edit** link.

## Project Layout

```
src/main/java/com/example/cybersourcedemo/
├── CybersourceDemoApplication.java          # Spring Boot entry point
├── config/
│   └── CybersourceConfig.java              # @ConfigurationProperties → SDK bridge
├── sdk/
│   └── ApiClientFactory.java               # Creates ApiClient per-request
├── dto/                                     # Request/response DTOs
├── service/                                 # Business logic per payment method
├── controller/
│   ├── api/                                 # REST endpoints (JSON)
│   └── ui/                                  # Thymeleaf page routing
└── exception/                               # Error handling

src/main/resources/
├── application.yml                          # CyberSource sandbox credentials
├── templates/
│   ├── fragments/layout.html                # Shared navbar, CSS (CyberShop branding)
│   ├── index.html                           # Product catalog
│   ├── cart.html                            # Shopping cart + payment method selection
│   ├── checkout.html                        # Multi-step checkout wizard
│   ├── result.html                          # Legacy result page
│   └── checkout/                            # Legacy per-method demo pages
└── static/js/
    ├── store.js                             # Cart, wizard, and checkout logic
    └── demo.js                              # Legacy demo page utilities
```

## Routes

| Route | Description |
|---|---|
| `/` | Product catalog (storefront) |
| `/cart` | Shopping cart with delivery options and payment method buttons |
| `/checkout?method=card` | Checkout wizard (card, wallet, eft, token, invoice, paymentLink) |
| `/demo/card`, `/demo/wallet`, etc. | Legacy per-method API test pages |
| `/api/*` | REST API endpoints |

## Next Steps

- Read the [Architecture](/getting-started/architecture/) guide to understand how the components fit together
- Review [Configuration](/getting-started/configuration/) for environment setup
- Jump into any [payment flow](/flows/card-payments/) to see detailed usage
