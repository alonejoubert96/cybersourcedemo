---
title: Configuration
description: How to configure the CyberSource Demo application.
---

## Application Configuration

All CyberSource settings are defined in `src/main/resources/application.yml` and bound to a Spring `@ConfigurationProperties` class.

### application.yml

```yaml
cybersource:
  merchant-id: testrest
  run-environment: apitest.cybersource.com
  authentication-type: http_signature
  merchant-key-id: ${CYBERSOURCE_KEY_ID:08c94330-f618-42a3-b09d-e1e43be5efda}
  merchant-secret-key: ${CYBERSOURCE_SECRET_KEY:yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=}

spring:
  thymeleaf:
    cache: false
```

### Property Descriptions

| Property | Description | Default |
|---|---|---|
| `merchant-id` | Your CyberSource merchant ID | `testrest` (sandbox) |
| `run-environment` | API endpoint hostname | `apitest.cybersource.com` (sandbox) |
| `authentication-type` | Auth method: `http_signature` or `jwt` | `http_signature` |
| `merchant-key-id` | UUID identifying your API key | Sandbox test key |
| `merchant-secret-key` | Base64-encoded shared secret | Sandbox test secret |

### Environment Variable Overrides

For production or custom sandbox credentials, set environment variables:

```bash
export CYBERSOURCE_KEY_ID="your-key-id-uuid"
export CYBERSOURCE_SECRET_KEY="your-base64-secret"
```

The `${VAR:default}` syntax in the YAML means the environment variable is used if set, otherwise the default value applies.

## CybersourceConfig Class

`config/CybersourceConfig.java` binds the YAML properties and converts them to the `Properties` object the SDK expects:

```java
@Configuration
@ConfigurationProperties(prefix = "cybersource")
@Getter @Setter
public class CybersourceConfig {
    private String merchantId;
    private String runEnvironment;
    private String authenticationType;
    private String merchantKeyId;
    private String merchantSecretKey;

    public Properties toSdkProperties() {
        Properties props = new Properties();
        props.setProperty("authenticationType", authenticationType);
        props.setProperty("merchantID", merchantId);
        props.setProperty("runEnvironment", runEnvironment);
        props.setProperty("merchantKeyId", merchantKeyId);
        props.setProperty("merchantsecretKey", merchantSecretKey);
        return props;
    }
}
```

:::note
The SDK property names are **case-sensitive** and differ from Spring's kebab-case convention. Notice `merchantID` (uppercase D) and `merchantsecretKey` (lowercase s) — these must match what the SDK expects.
:::

## ApiClientFactory

`sdk/ApiClientFactory.java` creates a fresh `ApiClient` for every API call:

```java
@Component
@RequiredArgsConstructor
public class ApiClientFactory {
    private final CybersourceConfig config;

    public ApiClient create() throws Exception {
        ApiClient apiClient = new ApiClient();
        MerchantConfig merchantConfig = new MerchantConfig(config.toSdkProperties());
        apiClient.merchantConfig = merchantConfig;
        return apiClient;
    }
}
```

:::caution
The SDK `ApiClient` is **not thread-safe**. It stores mutable state (response codes, status) on instance fields. Always create a new one per request — never share across threads or reuse between calls.
:::

## Sandbox vs Production

| Setting | Sandbox | Production |
|---|---|---|
| `run-environment` | `apitest.cybersource.com` | `api.cybersource.com` |
| `merchant-id` | `testrest` | Your merchant ID |
| `merchant-key-id` | Sandbox UUID | Your production key UUID |
| `merchant-secret-key` | Sandbox secret | Your production secret |

:::danger
Never commit production credentials to source control. Always use environment variables for production keys.
:::
