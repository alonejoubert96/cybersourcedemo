---
title: Test Data
description: Valid test data for the CyberSource sandbox environment.
---

All test data below works with the CyberSource sandbox (`apitest.cybersource.com`) using the default `testrest` merchant.

## Credit Cards

### Primary Test Card (Visa)

| Field | Value |
|---|---|
| Card Number | `4111111111111111` |
| Expiration Month | `12` |
| Expiration Year | `2031` |
| Security Code (CVV) | `123` |

### Additional Test Cards

| Brand | Number | Notes |
|---|---|---|
| Visa | `4111111111111111` | Standard test card |
| Visa | `4242424242424242` | Alternative Visa |
| Mastercard | `5555555555554444` | Standard Mastercard |
| Mastercard | `5105105105105100` | Alternative Mastercard |
| American Express | `378282246310005` | Amex (15 digits, 4-digit CVV) |
| Discover | `6011111111111117` | Standard Discover |
| Diners Club | `38520000023237` | 14-digit card |
| JCB | `3530111333300000` | Standard JCB |

### Amex CVV

American Express uses a 4-digit security code (CID): `1234`

## Bank Account (EFT / eCheck)

| Field | Value | Notes |
|---|---|---|
| Routing Number | `121042882` | ABA routing (Wells Fargo test) |
| Account Number | `4100` | Test account |
| Account Type | `C` | `C` = Checking, `S` = Savings |

:::caution
ACH/eCheck is a US payment system. The CyberSource sandbox **requires USD** for EFT transactions. The CyberShop storefront displays ZAR prices but sends USD to the API for EFT payments.
:::

## Digital Wallets

| Field | Value | Notes |
|---|---|---|
| Token Data | `4111111111111111` | Simulates DPAN from wallet |
| Cryptogram | `ABCDEFabcdef1234567890ABCDEF=` | Base64 network cryptogram |
| Expiration Month | `12` | |
| Expiration Year | `2026` | |

:::note
In production, wallet token data and cryptograms are provided by the wallet SDK (Google Pay API, Apple Pay JS, Samsung Pay SDK). These test values simulate that data for sandbox testing.
:::

## Billing Address

The CyberShop checkout uses South African defaults (pre-filled in the wizard):

| Field | Value |
|---|---|
| First Name | `Viktor` |
| Last Name | `Vaughn` |
| Email | `customer@example.com` |
| Phone | `0821234567` |
| Address | `123 Main Street` |
| City | `Cape Town` |
| State / Province | `Western Cape` |
| Postal Code | `8001` |
| Country | `South Africa` |

## Currency

| Payment Method | Currency | Notes |
|---|---|---|
| Card Payments | `ZAR` | South African Rand |
| Digital Wallets | `ZAR` | South African Rand |
| Tokenized Payments | `ZAR` | South African Rand |
| Invoices | `ZAR` | South African Rand |
| Payment Links | `ZAR` | South African Rand |
| EFT / eCheck | `USD` | ACH requires USD in the sandbox |

## Invoices

| Field | Value |
|---|---|
| Customer Email | `customer@example.com` |
| Description | `CyberShop order` |
| Amount | Cart total |
| Currency | `ZAR` |
| Due Date | 14 days from today |

## Payment Links

| Field | Value |
|---|---|
| Description | `CyberShop order` |
| Amount | Cart total |
| Currency | `ZAR` |

## Tokenized Payments

### Store Card

Use any valid test card above. The response returns a `customerId` to use for subsequent payments.

### Pay with Token

| Field | Value |
|---|---|
| Customer ID | _(from store card response)_ |
| Amount | Cart total |
| Currency | `ZAR` |

## Amount Testing

| Amount | Expected Behavior |
|---|---|
| `25.00` | Standard successful transaction |
| `102.21` | Standard amount used in CyberSource samples |
| `0.01` | Minimum valid amount |
| `9999.99` | Large transaction test |

## Sandbox Credentials

These are the default sandbox credentials used by this demo:

| Setting | Value |
|---|---|
| Merchant ID | `testrest` |
| Key ID | `08c94330-f618-42a3-b09d-e1e43be5efda` |
| Secret Key | `yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=` |
| Environment | `apitest.cybersource.com` |

:::caution
These are **public sandbox credentials** provided by CyberSource for testing. They should never be used in production.
:::
