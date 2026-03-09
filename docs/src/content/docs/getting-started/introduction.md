---
title: Introduction
description: Overview of the CyberSource Payment Demo application.
---

This is a **Spring Boot** demo application that showcases CyberSource payment integration across multiple payment methods. It provides both a REST API backend and a Thymeleaf-based UI so you can see each flow end-to-end.

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
- **Thymeleaf** + **Bootstrap 5 (CDN)** for the demo UI

## Quick Start

```bash
# Clone the repository and enter the project directory
cd "Cybersource Demo"

# Run the application
./gradlew bootRun

# The app starts on port 8080
# Open http://localhost:8080 in your browser
```

The landing page shows a grid of available payment methods. Click any card to open its checkout form — all forms come pre-populated with [valid test data](/reference/test-data/).

All forms submit via AJAX and display results inline. Multi-step flows (like Authorize → Capture → Refund) auto-populate transaction IDs between steps so you can walk through the full lifecycle without copy-pasting.

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
```

## Next Steps

- Read the [Architecture](/getting-started/architecture/) guide to understand how the components fit together
- Review [Configuration](/getting-started/configuration/) for environment setup
- Jump into any [payment flow](/flows/card-payments/) to see detailed usage
