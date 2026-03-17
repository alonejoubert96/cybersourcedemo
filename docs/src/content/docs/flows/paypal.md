---
title: PayPal (Coming Soon)
description: PayPal payment integration — not yet implemented.
---

:::caution[Not Yet Available]
PayPal integration is **stubbed but not implemented**. The `PayPalPaymentService` exists as a placeholder.
:::

## Current State

```java
@Service
public class PayPalPaymentService {
}
```

## Why It's Not Implemented

PayPal via CyberSource requires:

1. **Merchant-level configuration** — PayPal must be enabled as an alternative payment method in your CyberSource Business Center account
2. **No sample code** — The CyberSource samples repo does not include a PayPal sample
3. **BillingAgreementsApi** — The SDK has `BillingAgreementsApi` but the exact request flow depends on merchant setup

## UI Indication

On the landing page at `http://localhost:8080`, PayPal appears as a **disabled card** with a "Coming Soon" badge and "Not Available" label.

## What Would Be Needed

To implement PayPal, you would need to:

1. Enable PayPal in CyberSource Business Center
2. Use `BillingAgreementsApi` from the SDK
3. Handle the redirect flow (PayPal requires user redirect for authorization)
4. Add a `PayPalPaymentController` and Thymeleaf form
