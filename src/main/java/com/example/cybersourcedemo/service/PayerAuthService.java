package com.example.cybersourcedemo.service;

import Api.PayerAuthenticationApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayerAuthService {

    private final ApiClientFactory apiClientFactory;

    /** Known test card numbers — suffix → {number, type, expMonth, expYear}. Populated at seed time. */
    private final Map<String, Map<String, String>> knownCards = new java.util.concurrent.ConcurrentHashMap<>();

    public void registerCard(String suffix, String number, String type, String expMonth, String expYear) {
        Map<String, String> card = new HashMap<>();
        card.put("number", number);
        card.put("type", type);
        card.put("expirationMonth", expMonth);
        card.put("expirationYear", expYear);
        knownCards.put(suffix, card);
        log.info("Registered 3DS card ending in {}", suffix);
    }

    public Map<String, String> lookupCard(String suffix) {
        return knownCards.get(suffix);
    }

    /**
     * Step 1: Setup payer authentication — returns accessToken, deviceDataCollectionUrl, referenceId.
     */
    public Map<String, String> setup(String cardNumber, String cardType, String expMonth, String expYear) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            PayerAuthSetupRequest request = new PayerAuthSetupRequest();

            Riskv1authenticationsetupsClientReferenceInformation clientRef = new Riskv1authenticationsetupsClientReferenceInformation();
            clientRef.code("3ds-" + UUID.randomUUID().toString().substring(0, 8));
            request.clientReferenceInformation(clientRef);

            Riskv1authenticationsetupsPaymentInformation paymentInfo = new Riskv1authenticationsetupsPaymentInformation();
            Riskv1authenticationsetupsPaymentInformationCard card = new Riskv1authenticationsetupsPaymentInformationCard();
            card.number(cardNumber);
            card.type(cardType);
            card.expirationMonth(expMonth);
            card.expirationYear(expYear);
            paymentInfo.card(card);
            request.paymentInformation(paymentInfo);

            PayerAuthenticationApi api = new PayerAuthenticationApi(apiClient);
            RiskV1AuthenticationSetupsPost201Response result = api.payerAuthSetup(request);

            Map<String, String> response = new HashMap<>();
            response.put("status", result.getStatus());
            response.put("id", result.getId());

            if (result.getConsumerAuthenticationInformation() != null) {
                var authInfo = result.getConsumerAuthenticationInformation();
                response.put("accessToken", authInfo.getAccessToken());
                response.put("deviceDataCollectionUrl", authInfo.getDeviceDataCollectionUrl());
                response.put("referenceId", authInfo.getReferenceId());
            }

            log.info("3DS setup complete — referenceId: {}", response.get("referenceId"));
            return response;

        } catch (Invokers.ApiException e) {
            log.error("3DS setup error: {}", e.getResponseBody(), e);
            throw new PaymentException("3DS setup failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("3DS setup processing failed", e);
        }
    }

    /**
     * Step 3: Check enrollment — returns AUTHENTICATION_SUCCESSFUL (frictionless) or PENDING_AUTHENTICATION (challenge).
     */
    public Map<String, Object> checkEnrollment(String cardNumber, String cardType, String expMonth, String expYear,
                                                String amount, String currency, String referenceId, String returnUrl,
                                                Map<String, String> browserInfo) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CheckPayerAuthEnrollmentRequest request = new CheckPayerAuthEnrollmentRequest();

            Riskv1authenticationsetupsClientReferenceInformation clientRef = new Riskv1authenticationsetupsClientReferenceInformation();
            clientRef.code("3ds-enroll-" + UUID.randomUUID().toString().substring(0, 8));
            request.clientReferenceInformation(clientRef);

            // Payment info
            Riskv1authenticationsPaymentInformation paymentInfo = new Riskv1authenticationsPaymentInformation();
            Riskv1authenticationsetupsPaymentInformationCard card = new Riskv1authenticationsetupsPaymentInformationCard();
            card.number(cardNumber);
            card.type(cardType);
            card.expirationMonth(expMonth);
            card.expirationYear(expYear);
            paymentInfo.card(card);
            request.paymentInformation(paymentInfo);

            // Order info
            Riskv1authenticationsOrderInformation orderInfo = new Riskv1authenticationsOrderInformation();
            Riskv1authenticationsOrderInformationAmountDetails amountDetails = new Riskv1authenticationsOrderInformationAmountDetails();
            amountDetails.currency(currency);
            amountDetails.totalAmount(amount);
            orderInfo.amountDetails(amountDetails);

            Riskv1authenticationsOrderInformationBillTo billTo = new Riskv1authenticationsOrderInformationBillTo();
            billTo.firstName("Demo");
            billTo.lastName("Customer");
            billTo.address1("123 Main Street");
            billTo.locality("Cape Town");
            billTo.administrativeArea("Western Cape");
            billTo.postalCode("8001");
            billTo.country("ZA");
            billTo.email("demo@cybershop.test");
            billTo.phoneNumber("27821234567");
            orderInfo.billTo(billTo);
            request.orderInformation(orderInfo);

            // Consumer auth info
            Riskv1decisionsConsumerAuthenticationInformation consumerAuth = new Riskv1decisionsConsumerAuthenticationInformation();
            consumerAuth.referenceId(referenceId);
            consumerAuth.returnUrl(returnUrl);
            consumerAuth.transactionMode("S");
            consumerAuth.acsWindowSize("03"); // 500x600
            request.consumerAuthenticationInformation(consumerAuth);

            // Device info (browser fields from frontend)
            Riskv1authenticationsDeviceInformation deviceInfo = new Riskv1authenticationsDeviceInformation();
            deviceInfo.ipAddress(browserInfo.getOrDefault("ipAddress", "127.0.0.1"));
            deviceInfo.httpAcceptContent(browserInfo.getOrDefault("httpAcceptContent", "text/html"));
            deviceInfo.httpBrowserLanguage(browserInfo.getOrDefault("httpBrowserLanguage", "en-ZA"));
            deviceInfo.httpBrowserJavaEnabled(false);
            deviceInfo.httpBrowserJavaScriptEnabled(true);
            deviceInfo.httpBrowserColorDepth(browserInfo.getOrDefault("httpBrowserColorDepth", "24"));
            deviceInfo.httpBrowserScreenHeight(browserInfo.getOrDefault("httpBrowserScreenHeight", "1080"));
            deviceInfo.httpBrowserScreenWidth(browserInfo.getOrDefault("httpBrowserScreenWidth", "1920"));
            deviceInfo.httpBrowserTimeDifference(browserInfo.getOrDefault("httpBrowserTimeDifference", "-120"));
            deviceInfo.userAgentBrowserValue(browserInfo.getOrDefault("userAgentBrowserValue", "Mozilla/5.0"));
            request.deviceInformation(deviceInfo);

            PayerAuthenticationApi api = new PayerAuthenticationApi(apiClient);
            RiskV1AuthenticationsPost201Response result = api.checkPayerAuthEnrollment(request);

            Map<String, Object> response = new HashMap<>();
            response.put("status", result.getStatus());
            response.put("id", result.getId());

            if (result.getConsumerAuthenticationInformation() != null) {
                var authInfo = result.getConsumerAuthenticationInformation();
                Map<String, String> authData = new HashMap<>();
                authData.put("accessToken", authInfo.getAccessToken());
                authData.put("stepUpUrl", authInfo.getStepUpUrl());
                authData.put("authenticationTransactionId", authInfo.getAuthenticationTransactionId());
                authData.put("veresEnrolled", authInfo.getVeresEnrolled());
                authData.put("paresStatus", authInfo.getParesStatus());
                authData.put("cavv", authInfo.getCavv());
                authData.put("eci", authInfo.getEci());
                authData.put("eciRaw", authInfo.getEciRaw());
                authData.put("xid", authInfo.getXid());
                authData.put("specificationVersion", authInfo.getSpecificationVersion());
                authData.put("directoryServerTransactionId", authInfo.getDirectoryServerTransactionId());
                authData.put("indicator", authInfo.getEcommerceIndicator());
                authData.put("pareq", authInfo.getPareq());
                response.put("authenticationInformation", authData);
            }

            if (result.getErrorInformation() != null) {
                Map<String, String> errorData = new HashMap<>();
                errorData.put("reason", result.getErrorInformation().getReason());
                errorData.put("message", result.getErrorInformation().getMessage());
                response.put("errorInformation", errorData);
            }

            log.info("3DS enrollment check — status: {}", result.getStatus());
            return response;

        } catch (Invokers.ApiException e) {
            log.error("3DS enrollment error: {}", e.getResponseBody(), e);
            throw new PaymentException("3DS enrollment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("3DS enrollment processing failed", e);
        }
    }

    /**
     * Step 5: Validate authentication results after challenge completion.
     */
    public Map<String, Object> validateResults(String authenticationTransactionId,
                                                String cardNumber, String cardType, String expMonth, String expYear,
                                                String amount, String currency) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            ValidateRequest request = new ValidateRequest();

            Riskv1authenticationsetupsClientReferenceInformation clientRef = new Riskv1authenticationsetupsClientReferenceInformation();
            clientRef.code("3ds-validate-" + UUID.randomUUID().toString().substring(0, 8));
            request.clientReferenceInformation(clientRef);

            // Payment info
            Riskv1authenticationresultsPaymentInformation paymentInfo = new Riskv1authenticationresultsPaymentInformation();
            Riskv1authenticationresultsPaymentInformationCard card = new Riskv1authenticationresultsPaymentInformationCard();
            card.number(cardNumber);
            card.type(cardType);
            card.expirationMonth(expMonth);
            card.expirationYear(expYear);
            paymentInfo.card(card);
            request.paymentInformation(paymentInfo);

            // Order info
            Riskv1authenticationresultsOrderInformation orderInfo = new Riskv1authenticationresultsOrderInformation();
            Riskv1authenticationresultsOrderInformationAmountDetails amountDetails = new Riskv1authenticationresultsOrderInformationAmountDetails();
            amountDetails.currency(currency);
            amountDetails.totalAmount(amount);
            orderInfo.amountDetails(amountDetails);
            request.orderInformation(orderInfo);

            // Consumer auth — authenticationTransactionId from enrollment
            Riskv1authenticationresultsConsumerAuthenticationInformation consumerAuth = new Riskv1authenticationresultsConsumerAuthenticationInformation();
            consumerAuth.authenticationTransactionId(authenticationTransactionId);
            request.consumerAuthenticationInformation(consumerAuth);

            PayerAuthenticationApi api = new PayerAuthenticationApi(apiClient);
            RiskV1AuthenticationResultsPost201Response result = api.validateAuthenticationResults(request);

            Map<String, Object> response = new HashMap<>();
            response.put("status", result.getStatus());
            response.put("id", result.getId());

            if (result.getConsumerAuthenticationInformation() != null) {
                var authInfo = result.getConsumerAuthenticationInformation();
                Map<String, String> authData = new HashMap<>();
                authData.put("authenticationTransactionId", authInfo.getAuthenticationTransactionId());
                authData.put("cavv", authInfo.getCavv());
                authData.put("eci", authInfo.getEci());
                authData.put("eciRaw", authInfo.getEciRaw());
                authData.put("paresStatus", authInfo.getParesStatus());
                authData.put("xid", authInfo.getXid());
                authData.put("specificationVersion", authInfo.getSpecificationVersion());
                authData.put("directoryServerTransactionId", authInfo.getDirectoryServerTransactionId());
                authData.put("indicator", authInfo.getIndicator());
                response.put("authenticationInformation", authData);
            }

            log.info("3DS validation — status: {}", result.getStatus());
            return response;

        } catch (Invokers.ApiException e) {
            log.error("3DS validation error: {}", e.getResponseBody(), e);
            throw new PaymentException("3DS validation failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("3DS validation processing failed", e);
        }
    }
}
