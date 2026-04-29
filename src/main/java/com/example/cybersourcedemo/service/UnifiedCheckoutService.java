package com.example.cybersourcedemo.service;

import Api.PaymentsApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedCheckoutService {

    private final ApiClientFactory apiClientFactory;

    /**
     * Authorize a payment using a transient token from Unified Checkout v1.
     * The transient token contains the customer's payment data collected by the UC widget.
     */
    public PaymentResponse authorizeWithTransientToken(String transientToken, double amount, String currency) {
        log.info("Transient token length: {}, amount: {}, currency: {}", transientToken.length(), amount, currency);
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            // Client reference
            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("uc-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            // Token information — pass the transient token from UC v1
            // The token already contains payment data, amount, and billing info from the session
            Ptsv2paymentsTokenInformation tokenInfo = new Ptsv2paymentsTokenInformation();
            tokenInfo.transientTokenJwt(transientToken);
            paymentRequest.tokenInformation(tokenInfo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Unified Checkout payment successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("integration", "unified-checkout-v1"))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("UC v1 payment error: {}", e.getResponseBody(), e);
            throw new PaymentException("Unified Checkout payment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Unified Checkout payment processing failed", e);
        }
    }
}
